// Google Apps Script for 2FA Web App Integration
// This script handles user authentication using Google Sheets as a database

// Configuration
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your actual spreadsheet ID
const SHEET_NAME = 'Users';
const SESSION_DURATION = 3600; // Session duration in seconds (1 hour)

/**
 * Web app entry point - serves the HTML interface
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('2FA Web App')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Handle POST requests for authentication
 */
function doPost(e) {
  // Handle CORS preflight requests
  if (e.parameter.method === 'OPTIONS') {
    return handleCORS();
  }
  
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let response;
    switch(action) {
      case 'login':
        response = handleLogin(data);
        break;
      case 'register':
        response = handleRegister(data);
        break;
      case 'validateSession':
        response = validateSession(data);
        break;
      case 'logout':
        response = handleLogout(data);
        break;
      default:
        response = {
          success: false,
          error: 'Invalid action'
        };
    }
    
    return createCORSResponse(JSON.stringify(response));
  } catch (error) {
    return createCORSResponse(JSON.stringify({
      success: false,
      error: error.toString()
    }));
  }
}

/**
 * Handle CORS preflight requests
 */
function handleCORS() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '86400');
}

/**
 * Create a CORS-enabled response
 */
function createCORSResponse(content) {
  return ContentService.createTextOutput(content)
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Handle user login
 */
function handleLogin(data) {
  const { username, passcode } = data;
  
  if (!username || !passcode) {
    return {
      success: false,
      error: 'Username and passcode are required'
    };
  }
  
  const user = getUserByUsername(username);
  
  if (!user) {
    return {
      success: false,
      error: 'User not found'
    };
  }
  
  // Validate passcode (simple hash comparison)
  if (simpleHash(passcode) !== user.passcodeHash) {
    return {
      success: false,
      error: 'Invalid passcode'
    };
  }
  
  // Create session
  const sessionId = createSession(user.username);
  
  return {
    success: true,
    sessionId: sessionId,
    user: {
      username: user.username,
      displayName: user.displayName || user.username
    }
  };
}

/**
 * Handle user registration
 */
function handleRegister(data) {
  const { username, passcode, displayName } = data;
  
  if (!username || !passcode) {
    return {
      success: false,
      error: 'Username and passcode are required'
    };
  }
  
  // Check if user already exists
  const existingUser = getUserByUsername(username);
  if (existingUser) {
    return {
      success: false,
      error: 'Username already exists'
    };
  }
  
  // Create new user
  const passcodeHash = simpleHash(passcode);
  const success = createUser(username, passcodeHash, displayName || username);
  
  if (!success) {
    return {
      success: false,
      error: 'Failed to create user'
    };
  }
  
  return {
    success: true,
    message: 'User registered successfully'
  };
}

/**
 * Validate user session
 */
function validateSession(data) {
  const { sessionId } = data;
  
  if (!sessionId) {
    return {
      success: false,
      error: 'Session ID required'
    };
  }
  
  const session = getSession(sessionId);
  
  if (!session) {
    return {
      success: false,
      error: 'Invalid session'
    };
  }
  
  // Check if session is expired
  if (Date.now() / 1000 - session.createdAt > SESSION_DURATION) {
    deleteSession(sessionId);
    return {
      success: false,
      error: 'Session expired'
    };
  }
  
  return {
    success: true,
    user: {
      username: session.username,
      displayName: session.displayName
    }
  };
}

/**
 * Handle user logout
 */
function handleLogout(data) {
  const { sessionId } = data;
  
  if (sessionId) {
    deleteSession(sessionId);
  }
  
  return {
    success: true,
    message: 'Logged out successfully'
  };
}

// Database functions

/**
 * Get user by username from spreadsheet
 */
function getUserByUsername(username) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === username) {
        return {
          username: data[i][0],
          passcodeHash: data[i][1],
          displayName: data[i][2] || username,
          createdAt: data[i][3]
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Create new user in spreadsheet
 */
function createUser(username, passcodeHash, displayName) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const timestamp = new Date().toISOString();
    
    sheet.appendRow([username, passcodeHash, displayName, timestamp]);
    return true;
  } catch (error) {
    console.error('Error creating user:', error);
    return false;
  }
}

/**
 * Create a new session
 */
function createSession(username) {
  const sessionId = generateSessionId();
  const user = getUserByUsername(username);
  
  const session = {
    sessionId: sessionId,
    username: username,
    displayName: user ? user.displayName : username,
    createdAt: Date.now() / 1000
  };
  
  // Store session in PropertiesService (Google Apps Script's built-in storage)
  PropertiesService.getScriptProperties().setProperty(
    `session_${sessionId}`,
    JSON.stringify(session)
  );
  
  return sessionId;
}

/**
 * Get session by session ID
 */
function getSession(sessionId) {
  try {
    const sessionData = PropertiesService.getScriptProperties().getProperty(`session_${sessionId}`);
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Delete session
 */
function deleteSession(sessionId) {
  PropertiesService.getScriptProperties().deleteProperty(`session_${sessionId}`);
}

// Utility functions

/**
 * Simple hash function (same as in the frontend)
 */
function simpleHash(str) {
  let hash = 0, i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash.toString();
}

/**
 * Generate a random session ID
 */
function generateSessionId() {
  return Utilities.getUuid();
}

/**
 * Setup function to create the spreadsheet structure
 * Run this once to set up your spreadsheet
 */
function setupSpreadsheet() {
  try {
    // Always create a new spreadsheet for initial setup
    const spreadsheet = SpreadsheetApp.create('2FA Users Database');
    const spreadsheetId = spreadsheet.getId();
    
    console.log('✅ Created new spreadsheet with ID:', spreadsheetId);
    console.log('📋 Spreadsheet URL:', spreadsheet.getUrl());
    console.log('');
    console.log('🔧 NEXT STEPS:');
    console.log('1. Copy the Spreadsheet ID above');
    console.log('2. Update the SPREADSHEET_ID constant in Code.gs');
    console.log('3. Replace "YOUR_SPREADSHEET_ID_HERE" with:', spreadsheetId);
    console.log('');
    
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
    }
    
    // Set up headers
    const headers = ['Username', 'PasscodeHash', 'DisplayName', 'CreatedAt'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#4285f4')
      .setFontColor('white');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
    
    // Add some sample data for testing (optional)
    const sampleData = [
      ['testuser', simpleHash('password123'), 'Test User', new Date().toISOString()],
      ['demo_user', simpleHash('demo456'), 'Demo User', new Date().toISOString()]
    ];
    
    if (sampleData.length > 0) {
      sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
      console.log('✅ Added sample users for testing:');
      console.log('   - Username: testuser, Passcode: password123');
      console.log('   - Username: demo_user, Passcode: demo456');
    }
    
    console.log('');
    console.log('✅ Spreadsheet setup completed successfully!');
    console.log('📊 Your spreadsheet is ready with the following structure:');
    console.log('   Column A: Username');
    console.log('   Column B: PasscodeHash');
    console.log('   Column C: DisplayName');
    console.log('   Column D: CreatedAt');
    
  } catch (error) {
    console.error('❌ Error setting up spreadsheet:', error);
    console.error('Error details:', error.toString());
  }
}

/**
 * Alternative setup function for existing spreadsheets
 * Use this if you already have a spreadsheet and want to set it up
 */
function setupExistingSpreadsheet(spreadsheetId) {
  try {
    if (!spreadsheetId) {
      console.error('❌ Please provide a valid spreadsheet ID');
      return;
    }
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    console.log('✅ Opened existing spreadsheet:', spreadsheet.getName());
    
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      console.log('✅ Created new sheet:', SHEET_NAME);
    } else {
      console.log('✅ Found existing sheet:', SHEET_NAME);
    }
    
    // Set up headers
    const headers = ['Username', 'PasscodeHash', 'DisplayName', 'CreatedAt'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#4285f4')
      .setFontColor('white');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
    
    console.log('✅ Spreadsheet setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up existing spreadsheet:', error);
    console.error('Error details:', error.toString());
  }
}

/**
 * Helper function to test the current spreadsheet configuration
 * Run this to verify your setup is working correctly
 */
function testSpreadsheetConnection() {
  try {
    console.log('🔍 Testing spreadsheet connection...');
    console.log('📋 Current SPREADSHEET_ID:', SPREADSHEET_ID);
    
    if (SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
      console.log('❌ SPREADSHEET_ID is still set to placeholder value');
      console.log('💡 Please update the SPREADSHEET_ID constant with your actual spreadsheet ID');
      return;
    }
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('✅ Successfully connected to spreadsheet:', spreadsheet.getName());
    
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (sheet) {
      console.log('✅ Found sheet:', SHEET_NAME);
      
      const data = sheet.getDataRange().getValues();
      console.log('📊 Sheet has', data.length, 'rows (including header)');
      
      if (data.length > 1) {
        console.log('👥 Found', data.length - 1, 'users in the database');
      } else {
        console.log('📝 No users found (only header row exists)');
      }
    } else {
      console.log('❌ Sheet', SHEET_NAME, 'not found');
      console.log('💡 Run setupSpreadsheet() or setupExistingSpreadsheet() to create it');
    }
    
  } catch (error) {
    console.error('❌ Error testing spreadsheet connection:', error);
    console.error('Error details:', error.toString());
  }
}
