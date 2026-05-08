const AssetManager = (() => {
  const assetsDir = 'Geometry Dash 2.207 All Unlocked Soluble Texture Pack Icons Mix/assets/';
  
  const sheets = {
    game: { png: 'GJ_GameSheet-hd.png', plist: 'GJ_GameSheet-hd.plist' },
    fire: { png: 'FireSheet_01-hd.png', plist: 'FireSheet_01-hd.plist' },
    player: { png: 'icons/player_01-hd.png', plist: 'icons/player_01-hd.plist' }
  };
  
  const images = {};
  const frames = {};
  let totalToLoad = 0;
  let loadedCount = 0;
  let isReady = false;

  function parsePlist(xmlString, sheetId) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    const keys = xmlDoc.getElementsByTagName('key');
    let framesDict = null;
    for (let i = 0; i < keys.length; i++) {
      if (keys[i].textContent === 'frames') {
        framesDict = keys[i].nextElementSibling;
        break;
      }
    }

    if (!framesDict) return;

    let currentKey = null;
    for (let i = 0; i < framesDict.childNodes.length; i++) {
      const node = framesDict.childNodes[i];
      if (node.nodeType === 1) { // ELEMENT_NODE
        if (node.tagName === 'key') {
          currentKey = node.textContent;
        } else if (node.tagName === 'dict' && currentKey) {
          const frameData = parseDict(node);
          const rectMatch = frameData.textureRect.match(/\{\{(\d+),(\d+)\},\{(\d+),(\d+)\}\}/);
          if (rectMatch) {
            frames[currentKey] = {
              sheet: sheetId,
              x: parseInt(rectMatch[1]),
              y: parseInt(rectMatch[2]),
              w: parseInt(rectMatch[3]),
              h: parseInt(rectMatch[4]),
              rotated: frameData.textureRotated === true
            };
          }
          currentKey = null;
        }
      }
    }
  }

  function parseDict(dictNode) {
    const data = {};
    let currentKey = null;
    for (let i = 0; i < dictNode.childNodes.length; i++) {
      const node = dictNode.childNodes[i];
      if (node.nodeType === 1) {
        if (node.tagName === 'key') {
          currentKey = node.textContent;
        } else if (currentKey) {
          if (node.tagName === 'string') {
            data[currentKey] = node.textContent;
          } else if (node.tagName === 'true') {
            data[currentKey] = true;
          } else if (node.tagName === 'false') {
            data[currentKey] = false;
          } else if (node.tagName === 'integer' || node.tagName === 'real') {
            data[currentKey] = Number(node.textContent);
          }
          currentKey = null;
        }
      }
    }
    return data;
  }

  function load() {
    Object.keys(sheets).forEach(id => {
      totalToLoad += 2;
      
      const img = new Image();
      img.onload = () => checkLoad();
      img.src = assetsDir + sheets[id].png;
      images[id] = img;

      fetch(assetsDir + sheets[id].plist)
        .then(res => res.text())
        .then(text => {
          parsePlist(text, id);
          checkLoad();
        })
        .catch(err => {
          console.error("Failed to load plist", sheets[id].plist, err);
          checkLoad();
        });
    });
  }

  function checkLoad() {
    loadedCount++;
    if (loadedCount >= totalToLoad) {
      isReady = true;
      console.log("AssetManager: All assets loaded.");
    }
  }

  load();

  return {
    get isLoaded() { return isReady; },
    getFrame(key) {
      return frames[key] || null;
    },
    getImage(sheetId) {
      return images[sheetId] || null;
    },
    drawFrame(ctx, key, dx, dy, dw, dh) {
      const frame = frames[key];
      if (!frame || !images[frame.sheet]) return false;
      const img = images[frame.sheet];
      
      if (frame.rotated) {
        ctx.save();
        ctx.translate(dx + dw/2, dy + dh/2);
        ctx.rotate(-Math.PI/2);
        // When rotated in cocos2d plist, the physical bounds in the image swap w and h
        ctx.drawImage(img, frame.x, frame.y, frame.h, frame.w, -dh/2, -dw/2, dh, dw);
        ctx.restore();
      } else {
        ctx.drawImage(img, frame.x, frame.y, frame.w, frame.h, dx, dy, dw, dh);
      }
      return true;
    }
  };
})();
