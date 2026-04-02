# Quick Start: OpenAI Configuration (5 Simple Steps)

## Step 1: Get OpenAI API Key (2 minutes)

1. Visit: https://platform.openai.com/
2. Sign up/Login
3. Go to: https://platform.openai.com/api-keys
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)

## Step 2: Install OpenAI Package (30 seconds)

Open terminal in `backend` folder and run:

```bash
pip install openai
```

## Step 3: Create .env File (1 minute)

1. Go to `backend` folder
2. Create a file named `.env` (with the dot!)
3. Add this line (replace with your actual key):

```
image.png
```

**Example:**
```
OPENAI_API_KEY=sk-proj-abc123xyz789...
```

## Step 4: Restart Server (10 seconds)

Stop your backend server (Ctrl+C) and restart it:

```bash
python app.py
```

## Step 5: Test It (1 minute)

1. Go to "Post Product" or "Register Company"
2. Click "AI Generate" button next to Description field
3. Enter a prompt like "High-quality organic coffee beans"
4. Click "Generate Description"
5. ✅ Description should appear!

---

**Done!** 🎉

If it doesn't work, check the guide in `OPENAI_SETUP_GUIDE.md` for detailed troubleshooting.

---

## Note About API Format

The OpenAI documentation you're viewing may show newer API formats. Our implementation uses the standard `chat.completions` API which works with:
- `gpt-3.5-turbo` (recommended - cost-effective)
- `gpt-4` (more powerful, higher cost)
- `gpt-4-turbo` (balanced)

The code in our backend automatically handles both old and new OpenAI Python library formats for compatibility.

