# OpenAI API Configuration Guide

Follow these microsteps to configure OpenAI API for AI-powered description generation.

## Step 1: Get OpenAI API Key

1. **Open your web browser**
2. **Go to**: https://platform.openai.com/
3. **Click** "Sign up" (if you don't have an account) or "Log in" (if you have an account)
4. **Complete registration/login process**
5. **Once logged in, click on your profile icon** (top right corner)
6. **Select** "View API keys" from the dropdown menu
7. **Click** "Create new secret key" button
8. **Enter a name** for your API key (e.g., "DealsDouble AI")
9. **Click** "Create secret key"
10. **IMPORTANT**: Copy the API key immediately (you won't be able to see it again!)
11. **Paste it somewhere safe** (notepad, password manager, etc.) temporarily

## Step 2: Install OpenAI Package

### Option A: Using pip (Recommended)

1. **Open your terminal/command prompt**
2. **Navigate to the backend folder**:
   ```
   cd backend
   ```
3. **Activate your virtual environment** (if using one):
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. **Install OpenAI package**:
   ```
   pip install openai
   ```
5. **Wait for installation to complete**
6. **Verify installation**:
   ```
   pip list | findstr openai
   ```
   (On Mac/Linux, use: `pip list | grep openai`)

### Option B: Add to requirements.txt

1. **Open** `backend/requirements.txt` file
2. **Add this line** at the end:
   ```
   openai>=1.0.0
   ```
3. **Save the file**
4. **Run**:
   ```
   pip install -r requirements.txt
   ```

## Step 3: Add API Key to .env File

1. **Navigate to the `backend` folder** in your file explorer
2. **Look for** `.env` file
   - If it exists, open it with a text editor (Notepad, VS Code, etc.)
   - If it doesn't exist, create a new file named `.env` (make sure it starts with a dot)
3. **Open the `.env` file**
4. **Add this line** (paste your actual API key):
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
   **Example**:
   ```
   OPENAI_API_KEY=sk-proj-abc123xyz789...
   ```
5. **IMPORTANT**: 
   - Replace `sk-your-actual-api-key-here` with your actual API key
   - Do NOT use quotes around the API key
   - Make sure there are no spaces before or after the `=` sign
6. **Save the file**
7. **Verify the file looks like this** (with your actual key):
   ```
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
   ```

## Step 4: Verify .env File Location

1. **Make sure** `.env` file is in the `backend` folder
2. **File structure should be**:
   ```
   backend/
     ├── .env          ← Should be here
     ├── app.py
     ├── requirements.txt
     └── ...
   ```

## Step 5: Restart Backend Server

1. **Stop your backend server** if it's running:
   - Press `Ctrl + C` in the terminal where it's running
2. **Start the backend server again**:
   ```
   python app.py
   ```
   or
   ```
   flask run
   ```
3. **Check for any errors** in the console
4. **Look for this message** (it means OpenAI is configured):
   - No error message = Good! (OpenAI will work if API key is valid)
   - If you see "Warning: Failed to initialize OpenAI client" = Check your API key

## Step 6: Test the Configuration

1. **Open your browser**
2. **Go to**: http://localhost:3000 (or your frontend URL)
3. **Login** to your account
4. **Navigate to** "Post Product" or "Register Company"
5. **Click** "AI Generate" button next to Description field
6. **Enter a test prompt**, for example:
   - For product: "High-quality organic coffee beans"
   - For company: "Manufacturing company specializing in electronics"
7. **Click** "Generate Description"
8. **Wait a few seconds**
9. **Check if description is generated**:
   - ✅ If description appears = Configuration successful!
   - ❌ If error appears = Check API key and restart server

## Troubleshooting

### Issue: "Failed to generate description" error

**Solutions**:
1. **Check API key** is correct in `.env` file
2. **Restart backend server** after adding API key
3. **Verify OpenAI account** has credits (free tier gets $5 credit)
4. **Check internet connection**
5. **Verify package is installed**: `pip show openai`

### Issue: "OPENAI_API_KEY not found"

**Solutions**:
1. **Check** `.env` file exists in `backend` folder
2. **Verify** file is named exactly `.env` (with dot at start)
3. **Check** file is not named `.env.txt` or `env`
4. **Restart** backend server

### Issue: "Module 'openai' not found"

**Solutions**:
1. **Install package**: `pip install openai`
2. **Check virtual environment** is activated
3. **Verify installation**: `pip list | findstr openai`

### Issue: API Key invalid or expired

**Solutions**:
1. **Go to** https://platform.openai.com/api-keys
2. **Create a new API key**
3. **Update** `.env` file with new key
4. **Restart** backend server

## Quick Checklist

- [ ] Created OpenAI account
- [ ] Generated API key
- [ ] Installed openai package (`pip install openai`)
- [ ] Created/updated `.env` file in backend folder
- [ ] Added `OPENAI_API_KEY=your-key-here` to .env
- [ ] Restarted backend server
- [ ] Tested AI generation feature

## Security Notes

⚠️ **IMPORTANT**:
- **Never commit** `.env` file to git (it should be in `.gitignore`)
- **Never share** your API key publicly
- **Never paste** API key in code comments or documentation
- **Keep** your API key secure and private
- **Regenerate** key if you suspect it's compromised

## Cost Information

- OpenAI offers **$5 free credit** for new accounts
- GPT-3.5-turbo is very affordable (~$0.002 per 1K tokens)
- Each description generation uses ~500 tokens = ~$0.001 per description
- Monitor usage at: https://platform.openai.com/usage

---

**Need help?** Check the console logs in your backend server for specific error messages.

