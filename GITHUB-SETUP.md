# Push this portfolio to GitHub (step-by-step)

Use this with the **GitHub account you want** for this repo (e.g. portfolio account, not the other one).

---

## Step 1: Create the repo on GitHub (in the correct account)

1. Log in to GitHub in your browser with the **account you want** for this project.
2. Click **+** (top right) → **New repository**.
3. Set:
   - **Repository name:** e.g. `black-flag-archives-portfolio`
   - **Description:** (optional) e.g. "Portfolio demo – link directory (links removed)"
   - **Public**
   - **Do not** add a README, .gitignore, or license (we already have them).
4. Click **Create repository**.
5. Leave the page open; you’ll need the repo URL in Step 4.

---

## Step 2: Open a terminal in the portfolio folder

From your project:

```bash
cd /mnt/c/Users/user/Nextcloud/Projects/resources-website/black-flag-archives-portfolio
```

(Or in Windows: open the folder in Terminal / PowerShell and run the next commands there.)

---

## Step 3: Initialize Git and make the first commit

Run (you can copy-paste the block):

```bash
git init
git add .
git commit -m "Initial commit: portfolio version with links stripped"
```

---

## Step 4: Connect to the correct GitHub account

You have two accounts, so you must choose how to “point” this repo at the right one.

### Option A – HTTPS (simplest if you use one account in the browser)

1. On the GitHub repo page, click **Code** → **HTTPS** and copy the URL, e.g.  
   `https://github.com/YOUR_USERNAME/black-flag-archives-portfolio.git`
2. Add it as remote and push:

   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/black-flag-archives-portfolio.git
   git branch -M main
   git push -u origin main
   ```

3. When asked for credentials, use the **same GitHub account** you used in Step 1.  
   If the wrong account is used, sign out of GitHub in the browser/credential manager and try again, or use Option B.

### Option B – SSH (best when you have 2 GitHub accounts)

You use **different SSH keys** for each account and choose the account by the remote URL.

1. **Create (or reuse) an SSH key for this account** (if you don’t have one yet):

   ```bash
   ssh-keygen -t ed25519 -C "your-email@for-this-github.com" -f ~/.ssh/id_ed25519_portfolio
   ```

   Use the email of the GitHub account you want for this repo. You can leave passphrase empty or set one.

2. **Add the public key to GitHub (this account only)**  
   - Copy the key:  
     `cat ~/.ssh/id_ed25519_portfolio.pub`  
   - GitHub → **Settings** (your profile) → **SSH and GPG keys** → **New SSH key** → paste and save.

3. **Use a dedicated host in SSH config** so this repo always uses that key.  
   Edit `~/.ssh/config` (create if missing) and add:

   ```
   Host github-portfolio
       HostName github.com
       User git
       IdentityFile ~/.ssh/id_ed25519_portfolio
       IdentitiesOnly yes
   ```

   (Use `github-portfolio` or any name you like; it’s just an alias.)

4. **Add remote using that host** (replace `YOUR_USERNAME` and repo name if different):

   ```bash
   git remote add origin git@github-portfolio:YOUR_USERNAME/black-flag-archives-portfolio.git
   git branch -M main
   git push -u origin main
   ```

   Because the remote uses `github-portfolio`, Git will use the key you set for this account only.

---

## Step 5: Enable GitHub Pages (optional)

To host the site:

1. Repo → **Settings** → **Pages**.
2. Under **Source**: **Deploy from a branch**.
3. Branch: **main**, folder: **/ (root)** → **Save**.
4. After a minute, the site will be at:  
   `https://YOUR_USERNAME.github.io/black-flag-archives-portfolio/`

---

## Quick reference – which account is used?

| Method | How the “correct” account is chosen |
|--------|--------------------------------------|
| **HTTPS** | The account that’s logged in when Git asks for credentials (browser or credential helper). |
| **SSH (Option B)** | The key in `IdentityFile` for the `Host` you use in the remote URL (`github-portfolio` → your portfolio key). |

If something fails (e.g. “permission denied” or “repository not found”), double-check you’re logged in or using the key for the same account that owns the repo.
