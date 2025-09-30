# CORS Solution Guide for 2FA Web App

## 🔍 **Understanding the CORS Error**

The CORS (Cross-Origin Resource Sharing) error occurs when your frontend (running on `http://127.0.0.1:3000`) tries to make requests to Google Apps Script (running on `https://script.google.com`). Browsers block these cross-origin requests for security reasons.

## 🛠️ **Solution 1: Use Google Apps Script Web App Directly (Recommended)**

### **Step 1: Deploy as Web App**
1. In Google Apps Script, click **Deploy** → **New deployment**
2. Choose **Web app** as the type
3. Set **Execute as**: "Me"
4. Set **Who has access**: "Anyone" or "Anyone with Google account"
5. Click **Deploy**
6. Copy the **Web App URL**

### **Step 2: Use the Web App URL Directly**
Instead of using `index.html` locally, use the Google Apps Script web app URL directly:
- The web app will serve the HTML content
- No CORS issues because everything runs on the same domain
- More secure and reliable

### **Step 3: Update the HTML File**
In Google Apps Script:
1. Click the **+** next to "Files" in the left sidebar
2. Choose **HTML**
3. Name it `index.html`
4. Copy the content from your local `index.html` file
5. Update the `SCRIPT_URL` to use a relative path:

```javascript
// Change this:
const SCRIPT_URL = 'YOUR_SCRIPT_URL_HERE';

// To this:
const SCRIPT_URL = ''; // Empty string for same-origin requests
```

## 🛠️ **Solution 2: Local Development with CORS Headers**

### **Option A: Use a Local Web Server**
Instead of opening `index.html` directly in the browser, serve it through a local web server:

#### **Using Python:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### **Using Node.js:**
```bash
# Install http-server globally
npm install -g http-server

# Run the server
http-server -p 8000
```

#### **Using Live Server (VS Code Extension):**
1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

### **Option B: Use Browser with Disabled Security (Not Recommended)**
⚠️ **Warning: This is for development only and disables security features**

#### **Chrome:**
```bash
# Windows
chrome.exe --user-data-dir="C:/Chrome dev session" --disable-web-security

# Mac
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security

# Linux
google-chrome --disable-web-security --user-data-dir="/tmp/chrome_dev_test"
```

## 🛠️ **Solution 3: Update Google Apps Script CORS Headers**

The Google Apps Script has been updated to include CORS headers, but you need to redeploy it:

### **Step 1: Redeploy the Web App**
1. In Google Apps Script, click **Deploy** → **Manage deployments**
2. Click the **pencil icon** to edit the deployment
3. Click **Deploy** to create a new version
4. Copy the new **Web App URL**

### **Step 2: Test the Connection**
Use the `test_integration.html` file to test if CORS is working:
1. Open `test_integration.html` in your browser
2. Enter the new Web App URL
3. Try the test functions

## 🛠️ **Solution 4: Use JSONP (Alternative Approach)**

If CORS continues to be an issue, you can modify the Google Apps Script to support JSONP:

### **Update Google Apps Script:**
Add this function to `Code.gs`:

```javascript
/**
 * Handle JSONP requests for CORS compatibility
 */
function doGet(e) {
  const callback = e.parameter.callback;
  const action = e.parameter.action;
  
  if (callback && action) {
    let result;
    switch(action) {
      case 'validateSession':
        result = validateSession({ sessionId: e.parameter.sessionId });
        break;
      default:
        result = { success: false, error: 'Invalid action' };
    }
    
    const response = callback + '(' + JSON.stringify(result) + ')';
    return ContentService.createTextOutput(response)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  // Regular HTML response
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('2FA Web App')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
```

## 🧪 **Testing Your Setup**

### **Test 1: Direct Web App Access**
1. Open the Google Apps Script web app URL directly in your browser
2. Try to register a new user
3. Try to login with the registered user

### **Test 2: Local Development**
1. Use one of the local server solutions above
2. Open `http://localhost:8000` (or your server port)
3. Test the authentication flow

### **Test 3: Integration Test**
1. Open `test_integration.html`
2. Enter your Google Apps Script web app URL
3. Run the test functions

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"CORS policy blocked" error**
   - Solution: Use the Google Apps Script web app directly
   - Alternative: Use a local web server

2. **"Script URL not found" error**
   - Check that the web app URL is correct
   - Ensure the deployment is active
   - Verify the script has proper permissions

3. **"Spreadsheet not found" error**
   - Run `setupSpreadsheet()` function
   - Update the `SPREADSHEET_ID` constant
   - Check spreadsheet permissions

4. **"Permission denied" error**
   - Grant all requested permissions
   - Check deployment access settings
   - Ensure you're logged into the correct Google account

### **Debug Steps:**

1. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Look for error messages in the Console tab

2. **Check Google Apps Script Logs:**
   - In Apps Script editor, click "Executions"
   - View recent executions and error messages

3. **Test API Endpoints:**
   - Use `test_integration.html` to test individual endpoints
   - Check if the issue is with specific actions

## 📋 **Recommended Workflow**

### **For Development:**
1. Use **Solution 1** (Google Apps Script web app directly)
2. Deploy the HTML file to Google Apps Script
3. Test using the web app URL

### **For Production:**
1. Use **Solution 1** (Google Apps Script web app directly)
2. Set appropriate access permissions
3. Use HTTPS (handled by Google Apps Script)

### **For Local Testing:**
1. Use **Solution 2A** (Local web server)
2. Serve files through `http-server` or similar
3. Test locally before deploying

## 🎯 **Quick Fix Summary**

**Immediate Solution:**
1. Deploy your `index.html` to Google Apps Script
2. Use the web app URL directly instead of local files
3. No CORS issues because everything runs on the same domain

**Alternative:**
1. Use a local web server (Python, Node.js, or Live Server)
2. Access via `http://localhost:8000` instead of `file://`

The CORS headers have been added to the Google Apps Script, so redeploying should resolve the issue when using the web app directly. 