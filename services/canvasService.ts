import { LayoutConfig, PhotoData, EventConfig } from '../types';

export const createCompositeImage = async (
  photos: PhotoData[],
  layout: LayoutConfig,
  eventConfig: EventConfig,
  drawingUrl?: string | null
): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');

  // Base setup
  const BASE_WIDTH = 1200;
  const BASE_HEIGHT = BASE_WIDTH / layout.aspectRatio;

  canvas.width = BASE_WIDTH;
  canvas.height = BASE_HEIGHT;

  // 1. Fill Background
  if (layout.id !== 'instagram' && eventConfig.backgroundUrl) {
    // Fill entire canvas with background first
    await drawImageProp(ctx, eventConfig.backgroundUrl, 0, 0, canvas.width, canvas.height);
  } else if (layout.id !== 'instagram') {
    // Default nice gradient (skip for instagram which sets white later)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#fdfbf7');
    gradient.addColorStop(1, '#e2d1c3');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const padding = 60;

  // 2. Render Specific Layouts
  if (layout.id === 'instagram') {
    await renderInstagramLayout(ctx, photos, eventConfig, BASE_WIDTH, BASE_HEIGHT, drawingUrl);
  }
  else if (layout.id === 'strip') {
    // Vertical Strip with 4 photos
    const footerSpace = 300; // Space at bottom for elegant text
    const availableHeight = canvas.height - (padding * 2) - footerSpace;
    const photoHeight = (availableHeight - (padding * 3)) / 4; 
    const photoWidth = canvas.width - (padding * 2);
    
    // Draw photos with frames
    for (let i = 0; i < photos.length; i++) {
      const y = padding + (i * (photoHeight + padding));
      
      // Draw a subtle shadow behind photos
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 10;
      ctx.shadowOffsetY = 10;
      
      // White border/frame
      ctx.fillStyle = 'white';
      ctx.fillRect(padding - 10, y - 10, photoWidth + 20, photoHeight + 20);
      
      ctx.shadowColor = 'transparent'; // Reset for image

      await drawImageProp(ctx, photos[i].dataUrl, padding, y, photoWidth, photoHeight, true);
    }

    // Draw Elegant Text at bottom (Paulo & Thais style)
    drawElegantText(ctx, canvas.width, canvas.height, eventConfig, true);
  } 
  else if (layout.id === 'grid') {
    const size = (canvas.width - (padding * 3)) / 2;
    const startY = padding;

    // Draw white container for grid to pop
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(padding - 20, padding - 20, (size * 2) + padding + 40, (size * 2) + padding + 40);

    for (let i = 0; i < photos.length; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = padding + (col * (size + padding));
        const y = startY + (row * (size + padding));
        
        ctx.fillStyle = 'white';
        ctx.fillRect(x - 10, y - 10, size + 20, size + 20);
        
        await drawImageProp(ctx, photos[i].dataUrl, x, y, size, size, true);
    }
    
    // Overlay text in center or bottom depending on preference, here bottom
    drawElegantText(ctx, canvas.width, canvas.height, eventConfig);
  }
  else if (layout.id === 'polaroid') {
    const pWidth = canvas.width - (padding * 2);
    const pHeight = pWidth; 
    const y = padding + 100; // Push down a bit
    
    // Polaroid Paper
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 20;
    ctx.fillRect(padding, y, pWidth, canvas.height - y - padding);
    ctx.shadowColor = 'transparent';

    if (photos[0]) {
       await drawImageProp(ctx, photos[0].dataUrl, padding + 40, y + 40, pWidth - 80, pHeight - 80, true);
    }
    
    // Write text on the polaroid chin
    ctx.textAlign = 'center';
    ctx.fillStyle = '#111';
    
    // Fancy Script Name
    ctx.font = '400 120px "Great Vibes", cursive';
    // Gold Gradient for text
    const gradient = ctx.createLinearGradient(0, y + pHeight, canvas.width, y + pHeight);
    gradient.addColorStop(0, '#d4af37'); // Gold
    gradient.addColorStop(0.5, '#b8860b'); // Dark Goldenrod
    gradient.addColorStop(1, '#ffd700'); // Gold
    ctx.fillStyle = gradient;
    ctx.fillText(eventConfig.eventName, canvas.width / 2, y + pHeight + 200);

    ctx.font = '500 40px "Roboto", sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText(eventConfig.eventDate, canvas.width / 2, y + pHeight + 280);
  }
  else if (layout.id === 'signature') {
      const cardX = padding;
      const cardY = padding;
      const cardW = canvas.width - (padding * 2);
      const cardH = canvas.height - (padding * 2);
      
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;
      ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.shadowColor = 'transparent'; 

      const photoH = cardH * 0.6;
      if (photos[0]) {
          const innerPad = 20;
          await drawImageProp(ctx, photos[0].dataUrl, cardX + innerPad, cardY + innerPad, cardW - (innerPad * 2), photoH - (innerPad * 2), true);
      }

      const drawingY = cardY + photoH;
      const drawingH = cardH * 0.4;
      
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cardX + 20, drawingY);
      ctx.lineTo(cardX + cardW - 20, drawingY);
      ctx.stroke();

      if (drawingUrl) {
          await drawImageProp(ctx, drawingUrl, cardX + 20, drawingY + 20, cardW - 40, drawingH - 40, false);
      }

      ctx.fillStyle = '#9ca3af';
      ctx.font = '24px "Roboto", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(eventConfig.eventName + ' • ' + eventConfig.eventDate, cardX + cardW - 20, cardY + cardH - 20);
  }

  return canvas.toDataURL('image/jpeg', 0.9);
};


// --- INSTAGRAM LAYOUT LOGIC ---
const renderInstagramLayout = async (ctx: CanvasRenderingContext2D, photos: PhotoData[], config: EventConfig, w: number, h: number, drawingUrl?: string | null) => {
    // 0. White Background (Phone Screen)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // --- LAYOUT CONSTANTS ---
    const headerH = 130; 
    const navH = 80;
    
    // Profile Section
    const avatarSize = 160;
    const avatarY = headerH + 25;
    const avatarX = 50;
    
    // Text positions relative to Avatar
    // Name is below avatar with padding
    const nameY = avatarY + avatarSize + 40; 
    const locationY = nameY + 45;
    
    // Main Photo
    // We want the photo to start after the location text with some padding to prevent overlap
    const photoY = locationY + 40; 
    const photoSize = w; // Square 1200x1200
    
    // Footer Grid
    // Starts immediately after photo
    const gridY = photoY + photoSize;
    
    // 1. TOP HEADER (Gradient)
    const gradHeader = ctx.createLinearGradient(0, 0, w, 0);
    gradHeader.addColorStop(0, '#f9ce34');
    gradHeader.addColorStop(0.5, '#ee2a7b');
    gradHeader.addColorStop(1, '#6228d7');
    ctx.fillStyle = gradHeader;
    ctx.fillRect(0, 0, w, headerH);

    // Header Title (Custom or Default)
    const headerTitle = config.instagramHeader || "Enfim 💍 Casados";
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 4;
    ctx.font = 'bold 60px "Roboto", sans-serif'; 
    // Centered visually
    ctx.fillText(headerTitle, w / 2, 85); 
    ctx.shadowColor = 'transparent';
    
    // Status Bar Icons
    ctx.font = '500 32px "Roboto", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("●●●●● 5G", 30, 45);
    ctx.textAlign = 'right';
    ctx.fillText("100% 🔋", w - 30, 45);

    // Fake App Navigation Icons (Back arrow and Options dots)
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#fff';
    
    // Back Arrow (<) at left
    ctx.beginPath();
    ctx.moveTo(50, 70);
    ctx.lineTo(30, 90);
    ctx.lineTo(50, 110);
    ctx.stroke();

    // Dots (...) at right
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(w - 40, 90, 5, 0, Math.PI*2);
    ctx.arc(w - 65, 90, 5, 0, Math.PI*2);
    ctx.arc(w - 90, 90, 5, 0, Math.PI*2);
    ctx.fill();

    // 2. PROFILE SECTION
    // Avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.clip();
    
    if (config.instagramProfileImage) {
        await drawImageProp(ctx, config.instagramProfileImage, avatarX, avatarY, avatarSize, avatarSize, true);
    } else {
        ctx.fillStyle = '#eee';
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
        ctx.fillStyle = '#aaa';
        ctx.font = 'bold 60px "Roboto", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(config.eventName.slice(0,2).toUpperCase(), avatarX + avatarSize/2, avatarY + avatarSize/2 + 20);
    }
    ctx.restore();

    // Avatar Border
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = gradHeader;
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, (avatarSize/2) + 4, 0, Math.PI * 2);
    ctx.stroke();

    // Stats (To the right of avatar)
    const statsY = avatarY + (avatarSize/2);
    const statsStartX = 300;
    
    const drawStat = (label: string, val: string, x: number) => {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.font = 'bold 40px "Roboto", sans-serif';
        ctx.fillText(val, x, statsY - 10);
        ctx.fillStyle = '#999';
        ctx.font = '30px "Roboto", sans-serif';
        ctx.fillText(label, x, statsY + 30);
    }
    drawStat('posts', '1,4k', statsStartX + 80);
    drawStat('seguidores', '8,2k', statsStartX + 330);
    drawStat('seguindo', '210', statsStartX + 580);

    // Name & Location (Below avatar)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#000';
    ctx.font = 'bold 40px "Roboto", sans-serif';
    ctx.fillText(config.eventName, 40, nameY); 

    ctx.font = '35px "Roboto", sans-serif';
    ctx.fillStyle = '#666';
    const locText = `📍 ${config.eventLocation || 'Local'}   📅 ${config.eventDate}`;
    ctx.fillText(locText, 40, locationY);

    // --- DRAWING OVERLAY (To the right of text) ---
    if (drawingUrl) {
        const drawH = 120;
        const drawW = 300;
        const drawX = w - drawW - 30; 
        const drawY = nameY - 40; 
        
        ctx.save();
        await drawImageProp(ctx, drawingUrl, drawX, drawY, drawW, drawH, false);
        ctx.restore();
    }

    // 4. MAIN PHOTO AREA
    if (photos[0]) {
       await drawImageProp(ctx, photos[0].dataUrl, 0, photoY, photoSize, photoSize, true);
    } else {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, photoY, photoSize, photoSize);
        ctx.fillStyle = '#ccc';
        ctx.font = '30px "Roboto", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("Foto Principal", w/2, photoY + photoSize/2);
    }

    // 5. FOOTER GRID (Uploaded "Feed" Images)
    const footerImages = config.instagramFooterImages || [];
    const gridSize = w / 3;
    
    for(let i=0; i<3; i++) {
        const x = i * gridSize;
        const img = footerImages[i];
        
        if (img) {
             await drawImageProp(ctx, img, x + (i > 0 ? 2 : 0), gridY, gridSize - 2, gridSize, true);
        } else {
             ctx.fillStyle = i % 2 === 0 ? '#eee' : '#e0e0e0';
             ctx.fillRect(x, gridY, gridSize, gridSize);
             // Placeholder icon
             ctx.fillStyle = '#ccc';
             ctx.beginPath(); ctx.arc(x + gridSize/2, gridY + gridSize/2, 20, 0, Math.PI*2); ctx.fill();
        }
    }

    // 6. BOTTOM NAV
    const navY = h - navH;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, navY, w, navH);
    ctx.fillStyle = '#dbdbdb';
    ctx.fillRect(0, navY, w, 2); 
    
    // Icons
    const iconY = navY + (navH/2);
    const space = w / 5;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#000';
    
    // Home
    ctx.strokeRect(space * 0.5 - 15, iconY - 15, 30, 30);
    // Search
    ctx.beginPath(); ctx.arc(space * 1.5, iconY, 12, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(space * 1.5 + 8, iconY + 8); ctx.lineTo(space * 1.5 + 18, iconY + 18); ctx.stroke();
    // Add
    ctx.strokeRect(space * 2.5 - 15, iconY - 15, 30, 30);
    ctx.beginPath(); ctx.moveTo(space * 2.5, iconY - 8); ctx.lineTo(space * 2.5, iconY + 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(space * 2.5 - 8, iconY); ctx.lineTo(space * 2.5 + 8, iconY); ctx.stroke();
    // Heart
    drawHeart(ctx, space * 3.5 - 15, iconY - 15, 30, '#000');
    // Profile
    ctx.beginPath(); ctx.arc(space * 4.5, iconY, 15, 0, Math.PI*2); ctx.fill();
}

// --- HELPERS ---

// Draws text with the "Paulo & Thais" Gold Style
const drawElegantText = (ctx: CanvasRenderingContext2D, w: number, h: number, config: EventConfig, isStrip = false) => {
    const yStart = isStrip ? h - 150 : h - 150;
    
    ctx.textAlign = 'center';
    
    // 1. Names (Large Script)
    ctx.font = '400 180px "Great Vibes", cursive';
    
    // Shadow/Glow for readability over photos/bg
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = 'white'; // Base for shadow
    ctx.fillText(config.eventName, w / 2, yStart);
    
    // Gold Gradient Fill
    ctx.shadowColor = 'transparent'; // Turn off shadow for gradient fill
    const gradient = ctx.createLinearGradient(0, yStart - 100, w, yStart);
    gradient.addColorStop(0, '#FFF7CC'); // Light gold
    gradient.addColorStop(0.3, '#D4AF37'); // Gold
    gradient.addColorStop(0.6, '#C5A028'); // Darker gold
    gradient.addColorStop(1, '#FFF7CC'); 
    
    ctx.fillStyle = gradient;
    ctx.fillText(config.eventName, w / 2, yStart);
    
    // Stroke for sharpness
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#8a6e1e';
    ctx.strokeText(config.eventName, w / 2, yStart);

    // 2. Date
    ctx.font = '700 50px "Great Vibes", cursive';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,1)';
    ctx.shadowBlur = 10;
    // Simple text render since input is now free text
    ctx.fillText(config.eventDate, w / 2, yStart + 80);
    ctx.shadowColor = 'transparent';
};

// Helper to load image and draw cover/contain
const drawImageProp = (ctx: CanvasRenderingContext2D, imgUrl: string, x: number, y: number, w: number, h: number, cover = true) => {
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Calculate aspect ratio
      const r = Math.min(w / img.width, h / img.height);
      const nw = img.width * r;
      const nh = img.height * r;
      let ar = 1;

      if (cover) {
          // Object-fit: cover implementation
          const scale = Math.max(w / img.width, h / img.height);
          const xPos = (w - img.width * scale) / 2;
          const yPos = (h - img.height * scale) / 2;
          
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, w, h);
          ctx.clip();
          ctx.drawImage(img, x + xPos, y + yPos, img.width * scale, img.height * scale);
          ctx.restore();
      } else {
         // Object-fit: contain
         const scale = Math.min(w / img.width, h / img.height);
         const xPos = (w - img.width * scale) / 2;
         const yPos = (h - img.height * scale) / 2;
         ctx.drawImage(img, x + xPos, y + yPos, img.width * scale, img.height * scale);
      }
      resolve();
    };
    img.onerror = () => resolve(); // Don't crash on image error
    img.src = imgUrl;
  });
};

// Icon Helpers
const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    const topCurveHeight = s * 0.3;
    ctx.moveTo(x + s/2, y + s/5);
    ctx.bezierCurveTo(x + s/2, y, x, y, x, y + topCurveHeight);
    ctx.bezierCurveTo(x, y + (s + topCurveHeight) / 2, x + s/2, y + s, x + s/2, y + s);
    ctx.bezierCurveTo(x + s/2, y + s, x + s, y + (s + topCurveHeight) / 2, x + s, y + topCurveHeight);
    ctx.bezierCurveTo(x + s, y, x + s/2, y, x + s/2, y + s/5);
    ctx.fill();
};

const drawBubble = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(x + s/2, y + s/2 - 5, s/2, s/2 - 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Tail
    ctx.beginPath();
    ctx.moveTo(x + 20, y + s - 15);
    ctx.lineTo(x + 10, y + s);
    ctx.lineTo(x + 35, y + s - 8);
    ctx.stroke();
    ctx.fill();
};

const drawPlane = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 5, y + s/2);
    ctx.lineTo(x + s - 5, y + 5);
    ctx.lineTo(x + s/2, y + s - 5);
    ctx.lineTo(x + 5, y + s/2);
    ctx.lineTo(x + s - 5, y + 5); // Diagonal
    ctx.stroke();
};

const drawBookmark = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 5, y);
    ctx.lineTo(x + s - 5, y);
    ctx.lineTo(x + s - 5, y + s);
    ctx.lineTo(x + s/2, y + s - 15);
    ctx.lineTo(x + 5, y + s);
    ctx.closePath();
    ctx.stroke();
};
