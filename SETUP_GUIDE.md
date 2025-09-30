# 2FA Web App - Google Apps Script Integration Setup Guide

This guide will help you set up the 2FA web app with Google Apps Script and Google Sheets integration for user authentication.

## Prerequisites

- A Google account
- Access to Google Apps Script
- Access to Google Sheets

## Step 1: Create Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com/)
2. Click "New Project"
3. Replace the default code with the contents of `Code.gs`
4. Save the project with a name like "2FA Web App"

## Step 2: Set Up the Spreadsheet Database

1. In your Google Apps Script project, run the `setupSpreadsheet()` function:
   - Click on the function dropdown in the editor
   - Select `setupSpreadsheet`
   - Click the "Run" button
   - Grant necessary permissions when prompted

2. The script will create a new Google Spreadsheet with the following structure:
   - **Username**: User's login username
   - **PasscodeHash**: Hashed version of the user's passcode
   - **DisplayName**: User's display name (optional)
   - **CreatedAt**: Timestamp when the user was created

3. Copy the Spreadsheet ID from the URL (the long string between `/d/` and `/edit`)

## Step 3: Configure the Script

1. In `Code.gs`, replace `YOUR_SPREADSHEET_ID_HERE` with the actual Spreadsheet ID you copied
2. Save the script

## Step 4: Deploy as Web App

1. Click "Deploy" → "New deployment"
2. Choose "Web app" as the type
3. Set the following options:
   - **Execute as**: "Me" (your Google account)
   - **Who has access**: Choose based on your needs:
     - "Anyone" for public access
     - "Anyone with Google account" for Google users only
     - "Only myself" for personal use only
4. Click "Deploy"
5. Copy the Web App URL

## Step 5: Configure the Frontend

1. In `index.html`, replace `YOUR_SCRIPT_URL_HERE` with the Web App URL you copied
2. Save the file

## Step 6: Test the Application

1. Open `index.html` in a web browser
2. You should see a login/register form
3. Create a new account using the register option
4. Login with your credentials
5. Add 2FA accounts and test the TOTP generation

## Security Considerations

### Current Implementation
- Uses simple hash function (not cryptographically secure)
- Passcodes are stored as hashes in Google Sheets
- Sessions are stored in Google Apps Script Properties Service
- No HTTPS enforcement (depends on Google Apps Script deployment)

### Recommended Improvements
- Use a more secure hashing algorithm (bcrypt, PBKDF2)
- Implement rate limiting for login attempts
- Add HTTPS enforcement
- Consider using Google Identity Services for enhanced security
- Implement proper session management with expiration

## Troubleshooting

### Common Issues

1. **"Script URL not found" error**
   - Make sure the Web App URL is correct
   - Ensure the deployment is active
   - Check that the script has proper permissions

2. **"Spreadsheet not found" error**
   - Verify the Spreadsheet ID is correct
   - Ensure the script has access to the spreadsheet
   - Check that the "Users" sheet exists

3. **CORS errors**
   - This is normal for Google Apps Script web apps
   - The script handles CORS automatically

4. **Permission denied errors**
   - Make sure you're logged into the correct Google account
   - Grant all requested permissions when prompted
   - Check that the deployment settings allow your access level

### Debugging

1. Check the Google Apps Script execution logs:
   - In the Apps Script editor, click "Executions" in the left sidebar
   - View recent executions and any error messages

2. Check browser console for frontend errors:
   - Open browser developer tools (F12)
   - Look for JavaScript errors in the Console tab

3. Test API endpoints directly:
   - Use tools like Postman or curl to test the web app URL
   - Send POST requests with JSON data to test authentication

## File Structure

```
2fa/
├── Code.gs                 # Google Apps Script backend
├── index.html             # Frontend application
├── SETUP_GUIDE.md         # This setup guide
└── index.zip              # Backup/archive file
```

## API Endpoints

The Google Apps Script provides the following endpoints:

- **POST /login**: Authenticate user with username and passcode
- **POST /register**: Create new user account
- **POST /validateSession**: Validate current session
- **POST /logout**: End user session

All endpoints expect JSON data and return JSON responses.

## Customization

### Changing Session Duration
In `Code.gs`, modify the `SESSION_DURATION` constant (in seconds).

### Adding User Roles
Extend the spreadsheet structure to include role columns and modify the authentication logic.

### Custom Styling
Modify the CSS in `index.html` to match your brand or preferences.

### Additional Security
Consider implementing:
- Two-factor authentication for login
- IP-based access restrictions
- Audit logging
- Account lockout after failed attempts

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Google Apps Script documentation
3. Check browser console and Apps Script execution logs
4. Ensure all permissions are properly granted

## License

This project is provided as-is for educational and personal use. Please review and modify security measures for production use. 