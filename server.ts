import express from 'express';
import session from 'cookie-session';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SESSION_SECRET = process.env.SESSION_SECRET || 'mahjong-secret-default';

function getPrivateKey() {
  let key = process.env.GOOGLE_PRIVATE_KEY;
  if (!key) return undefined;
  
  // AI Studio secrets can sometimes include surrounding quotes or escaped newlines
  key = key.trim();
  
  // Remove surrounding quotes if they exist
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.substring(1, key.length - 1);
  } else if (key.startsWith("'") && key.endsWith("'")) {
    key = key.substring(1, key.length - 1);
  }

  // Convert literal \n strings into actual newlines
  key = key.replace(/\\n/g, '\n');
  
  return key;
}

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: getPrivateKey(),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Verify key format on startup
const privateKey = getPrivateKey();
if (privateKey) {
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    console.warn('Warning: GOOGLE_PRIVATE_KEY might be missing the BEGIN header.');
  }
  if (!privateKey.includes('-----END PRIVATE KEY-----')) {
    console.warn('Warning: GOOGLE_PRIVATE_KEY might be missing the END header.');
  }
} else {
  console.error('Error: GOOGLE_PRIVATE_KEY is not defined in environment variables.');
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  
  // Normalize protocol for cookies behind the AIS proxy
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] === 'http') {
      req.headers['x-forwarded-proto'] = 'https';
    }
    next();
  });
  
  app.use(
    session({
      name: 'mahjong_session',
      keys: [SESSION_SECRET],
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: true,
      sameSite: 'none',
      httpOnly: true,
    })
  );

  app.use((req, res, next) => {
    // Log headers and session for debugging
    if (req.path.startsWith('/api')) {
      const proto = req.headers['x-forwarded-proto'] || 'none';
      const cookieHeader = req.headers.cookie || '';
      const hasSessionCookie = cookieHeader.includes('mahjong_session');
      console.log(`[DEBUG] ${req.method} ${req.path} | Proto: ${proto} | Secure: ${req.secure} | HasSession: ${hasSessionCookie} | User: ${req.session?.user ? req.session.user.email : 'none'}`);
      if (req.path === '/api/auth/login') {
        console.log(`[DEBUG] Login headers: ${JSON.stringify({
          'x-forwarded-proto': req.headers['x-forwarded-proto'],
          'x-forwarded-for': req.headers['x-forwarded-for'],
          'host': req.headers.host
        })}`);
      }
    }
    next();
  });

  // Authentication Middleware
  const ensureAuthenticated = (req: any, res: any, next: any) => {
    if (req.session?.user) {
      return next();
    }
    console.warn(`[AUTH] 401 Unauthorized: Path: ${req.path}, SessionData: ${JSON.stringify(req.session)}`);
    res.status(401).json({ 
      error: 'Unauthorized', 
      details: 'Session not found or expired. Check if browser is blocking third-party cookies or if "Secure" cookie requirement is met over HTTPS.' 
    });
  };

  // Auth Endpoints
  app.post('/api/auth/login', async (req: any, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    console.log(`[AUTH] Login attempt for: ${email}`);

    try {
      if (!SPREADSHEET_ID) throw new Error('Spreadsheet ID not configured');

      const sheets = google.sheets({ version: 'v4', auth });
      
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });
      const sheetNames = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
      
      let targetSheet = sheetNames.find(name => name && name.trim().toLowerCase() === 'players');
      if (!targetSheet) {
        targetSheet = sheetNames.find(name => name && name.toLowerCase().includes('player'));
      }

      if (!targetSheet) {
        return res.status(500).json({ error: `Could not find a "Players" tab in your Google Sheet.` });
      }

      const playersSheet = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${targetSheet}!A1:Z500`,
      });

      const rows = playersSheet.data.values || [];
      console.log(`[AUTH] Checking players list. Found ${rows.length} rows.`);
      const firstRow = rows[0]?.map(c => String(c || '').toLowerCase()) || [];
      const hasHeader = firstRow.some(cell => cell.includes('name') || cell.includes('email') || cell.includes('player'));
      const dataRows = hasHeader ? rows.slice(1) : rows;

      const normalizedEmail = email.trim().toLowerCase();
      const userRow = dataRows.find(row => 
        (row[1] && String(row[1]).trim().toLowerCase() === normalizedEmail) || 
        (row[0] && String(row[0]).trim().toLowerCase() === normalizedEmail)
      );

      if (!userRow && normalizedEmail !== 'katietsang.1011@gmail.com') {
        console.warn(`[AUTH] Access denied for ${normalizedEmail}. Not in sheet.`);
        return res.status(403).json({ 
          error: `Email "${email}" not found in authorized players list.`
        });
      }

      req.session.user = {
        email: normalizedEmail,
        name: userRow ? String(userRow[0]).trim() : 'Admin',
        picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      };

      console.log(`[AUTH] Login success for ${email}. Session data: ${JSON.stringify(req.session)}`);
      res.status(200).json(req.session.user);
    } catch (error: any) {
      console.error('[AUTH] Login error:', error.message);
      res.status(500).json({ error: 'Failed to verify player list. ' + error.message });
    }
  });

  app.get('/api/auth/me', (req: any, res) => {
    console.log(`[AUTH] /api/auth/me | User: ${req.session?.user?.email || 'none'}`);
    res.json(req.session?.user || null);
  });

  app.post('/api/auth/logout', (req: any, res) => {
    req.session = null;
    res.json({ success: true });
  });

  // Debug Endpoint to list sheets
  app.get('/api/debug/sheets', ensureAuthenticated, async (req: any, res) => {
    if (!SPREADSHEET_ID) return res.status(400).json({ error: 'Spreadsheet ID not configured' });
    try {
      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });
      const sheetNames = response.data.sheets?.map(s => s.properties?.title) || [];
      res.json({ sheetNames });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Data Endpoints
  app.get('/api/players', ensureAuthenticated, async (req: any, res) => {
    if (!SPREADSHEET_ID) {
      return res.status(400).json({ error: 'Spreadsheet ID not configured' });
    }

    const sheets = google.sheets({ version: 'v4', auth });

    try {
      // First, get the spreadsheet metadata to find the correct tab name
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      }).catch(err => {
        throw new Error(`Failed to access spreadsheet: ${err.message}. Check SPREADSHEET_ID and service account access.`);
      });

      const sheetNames = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
      console.log('Available sheets:', sheetNames);

      // Look for a tab named "Players" (case-insensitive) or containing "player"
      let targetSheet = sheetNames.find(name => name?.toLowerCase() === 'players');
      if (!targetSheet) {
        targetSheet = sheetNames.find(name => name?.toLowerCase().includes('player'));
      }

      if (!targetSheet) {
        throw new Error(`Could not find a "Players" tab. Available tabs: ${sheetNames.join(', ')}`);
      }

      console.log(`Fetching players from sheet: "${targetSheet}"`);
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${targetSheet}!A1:Z500`, 
      }).catch(err => {
        console.error('Sheet API Error:', err.message);
        throw new Error(`Google Sheets fetch failed for tab "${targetSheet}": ${err.message}`);
      });
      
      const rows = response.data.values || [];
      console.log(`[SHEETS] Found ${rows.length} rows in "${targetSheet}". Raw row 0:`, JSON.stringify(rows[0] || []));

      if (rows.length === 0) {
        console.warn(`[SHEETS] Tab "${targetSheet}" returned no data.`);
        return res.json([]);
      }

      // Detect header
      const firstRow = rows[0].map(c => String(c || '').toLowerCase());
      const hasHeader = firstRow.some(cell => cell.includes('name') || cell.includes('email') || cell.includes('player'));
      console.log(`[SHEETS] detected header: ${hasHeader}`);
      
      const dataRows = hasHeader ? rows.slice(1) : rows;
      
      const players = dataRows
        .filter(row => row && row[0] && String(row[0]).trim()) 
        .map(row => ({
          name: String(row[0]).trim(),
          email: String(row[1] || row[0]).trim(), 
          group: row[2] ? String(row[2]).trim() : undefined,
        }));
      
      console.log(`[SHEETS] Processed ${players.length} players. Names:`, players.map(p => p.name));
      res.json(players);
    } catch (error: any) {
      console.error('Error fetching players:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/game/log', ensureAuthenticated, async (req: any, res) => {
    if (!SPREADSHEET_ID) {
      return res.status(400).json({ error: 'Spreadsheet ID not configured' });
    }

    const { east, south, west, north } = req.body;
    const sheets = google.sheets({ version: 'v4', auth });

    try {
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });
      const sheetNames = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
      
      // Look for a tab named "Games", "Logs", "History", "Records" or the first sheet if none found
      let targetSheet = sheetNames.find(name => 
        name && ['games', 'logs', 'history', 'records'].includes(name.toLowerCase())
      );
      
      if (!targetSheet) {
        // Fallback: search for sheet with "game" or "log" in name
        targetSheet = sheetNames.find(name => name && (name.toLowerCase().includes('game') || name.toLowerCase().includes('log')));
      }

      // If still not found, use the first sheet that is NOT "Players"
      if (!targetSheet) {
        targetSheet = sheetNames.find(name => name && !name.toLowerCase().includes('player')) || sheetNames[0];
      }

      const gameId = Date.now().toString();
      const timestamp = new Date().toISOString();

      const row = [
        gameId,
        timestamp,
        east.player, east.score,
        south.player, south.score,
        west.player, west.score,
        north.player, north.score,
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${targetSheet}!A:J`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
      });

      // --- ACCOUNTING SETTLEUP LOGIC ---
      let settleupSheet = sheetNames.find(name => name && name.toLowerCase() === 'settleup');
      if (settleupSheet) {
        // Fetch players to get groups
        const playersResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `Players!A1:Z500`,
        });
        const playerRows = playersResponse.data.values || [];
        const playerHeader = playerRows[0]?.map(c => String(c || '').toLowerCase()) || [];
        
        // Find column indices
        const nameIdx = playerHeader.indexOf('name');
        const groupIdx = playerHeader.indexOf('group');
        
        const pDataRows = playerRows.slice(1);
        const playerToGroup: Record<string, string> = {};
        
        pDataRows.forEach(r => {
          const pName = r[nameIdx !== -1 ? nameIdx : 0];
          const pGroup = r[groupIdx !== -1 ? groupIdx : 2];
          if (pName) {
            const trimmedName = String(pName).trim().toLowerCase();
            playerToGroup[trimmedName] = pGroup ? String(pGroup).trim() : String(pName).trim();
          }
        });

        const posData = [east, south, west, north];
        const settleupRows: any[][] = [];
        posData.forEach(pos => {
          if (!pos.player) return;
          const names = pos.player.split(/\s+and\s+|[&+]/i).filter((s: string) => s.trim().length > 0);
          const score = parseFloat(pos.score) || 0;
          const share = score / names.length;

          names.forEach((name: string) => {
            const trimmedName = name.trim();
            if (!trimmedName) return;
            settleupRows.push([
              gameId,
              timestamp,
              trimmedName, // Store individual player name
              share,
              req.session.user?.name || 'System',
              'Game Split'
            ]);
          });
        });

        if (settleupRows.length > 0) {
          await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `'${settleupSheet}'!A:F`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: settleupRows },
          });
        }
      }

      res.json({ success: true, gameId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/game/history', ensureAuthenticated, async (req: any, res) => {
    if (!SPREADSHEET_ID) {
      return res.status(400).json({ error: 'Spreadsheet ID not configured' });
    }

    const sheets = google.sheets({ version: 'v4', auth });

    try {
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });
      const sheetNames = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
      
      console.log(`[SHEETS] Available sheets:`, sheetNames);
      
      let targetSheet = sheetNames.find(name => 
        name && ['games', 'logs', 'history', 'records'].includes(name.toLowerCase())
      );
      
      if (!targetSheet) {
        targetSheet = sheetNames.find(name => name && (name.toLowerCase().includes('game') || name.toLowerCase().includes('log')));
      }

      if (!targetSheet) {
        targetSheet = sheetNames.find(name => name && !name.toLowerCase().includes('player')) || sheetNames[0];
      }

      console.log(`[SHEETS] Using "${targetSheet}" for game history`);

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${targetSheet}!A1:J500`,
      });
      const rows = response.data.values || [];
      console.log(`[SHEETS] Fetched ${rows.length} rows from "${targetSheet}"`);
      
      if (rows.length === 0) return res.json([]);

      // Skip header if present
      const firstRow = rows[0].map(c => String(c || '').toLowerCase());
      const hasHeader = firstRow.some(cell => cell.includes('game') || cell.includes('id') || cell.includes('timestamp') || cell.includes('player'));
      const dataRows = hasHeader ? rows.slice(1) : rows;

      const logs = dataRows
        .filter(row => row && row.length >= 2 && row[0]) // Ensure at least Game ID and Timestamp
        .map(row => ({
        gameId: row[0] || '',
        timestamp: row[1] || '',
        east: { player: row[2] || '', score: row[3] || '0' },
        south: { player: row[4] || '', score: row[5] || '0' },
        west: { player: row[6] || '', score: row[7] || '0' },
        north: { player: row[8] || '', score: row[9] || '0' },
      })).reverse(); // Latest first
      
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/accounting/history', ensureAuthenticated, async (req: any, res) => {
    if (!SPREADSHEET_ID) return res.status(400).json({ error: 'Spreadsheet ID not configured' });
    const sheets = google.sheets({ version: 'v4', auth });
    try {
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
      const sheetNames = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
      const targetSheet = sheetNames.find(name => name && name.toLowerCase() === 'settleup');
      
      if (!targetSheet) return res.json([]);

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${targetSheet}'!A1:F1000`,
      });
      const rows = response.data.values || [];
      if (rows.length === 0) return res.json([]);

      const firstRow = rows[0].map(c => String(c || '').toLowerCase());
      const hasHeader = firstRow.some(cell => cell.includes('game') || cell.includes('group') || cell.includes('amount'));
      const dataRows = hasHeader ? rows.slice(1) : rows;

      const records = dataRows.map(row => ({
        gameId: row[0] || '',
        timestamp: row[1] || '',
        group: row[2] || '',
        amount: parseFloat(row[3]) || 0,
        user: row[4] || 'N/A',
        comment: row[5] || ''
      })).reverse();
      
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/accounting/transfer', ensureAuthenticated, async (req: any, res) => {
    if (!SPREADSHEET_ID) return res.status(400).json({ error: 'Spreadsheet ID not configured' });
    const { fromGroup, toGroup, amount, comment } = req.body;
    if (!fromGroup || !toGroup || !amount) return res.status(400).json({ error: 'Missing fields' });

    const sheets = google.sheets({ version: 'v4', auth });
    try {
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
      const sheetNames = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
      const targetSheet = sheetNames.find(name => name && name.toLowerCase() === 'settleup');
      
      if (!targetSheet) return res.status(500).json({ error: 'Settleup sheet not found' });

      const transferId = `transfer-${Date.now()}`;
      const timestamp = new Date().toISOString();
      const finalComment = comment || 'Manual Transfer';

      const rows = [
        [transferId, timestamp, fromGroup, amount, req.session.user?.name || 'System', finalComment],
        [transferId, timestamp, toGroup, -amount, req.session.user?.name || 'System', finalComment]
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${targetSheet}'!A:F`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: rows },
      });
      res.json({ success: true, transferId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`App URL: ${process.env.APP_URL}`);
  });
}

startServer();
