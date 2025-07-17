# Chat Interface

A Node.js chat application using Express and Google's Gemini AI.

## Server Setup Instructions

### 1. Update System & Install Basic Tools
```bash
sudo apt-get update && sudo apt-get upgrade
sudo apt-get install git
```

### 2. Set up GitHub Authentication
```bash
# Generate SSH key (press Enter for default location and optional passphrase)
ssh-keygen -t ed25519 -C "jamesbeeson01@gmail.com"

# Start the ssh-agent
eval "$(ssh-agent -s)"

# Add your SSH key to the agent
ssh-add ~/.ssh/id_ed25519

# Display your public key (add this to GitHub)
cat ~/.ssh/id_ed25519.pub
```

Then:
1. Go to GitHub → Settings → SSH and GPG keys
2. Click "New SSH key"
3. Paste the output from the cat command
4. Click "Add SSH key"

Test your SSH connection:
```bash
ssh -T git@github.com
```
You should see a message confirming successful authentication.

### 3. Install Node.js and npm
```bash
sudo apt-get install nodejs npm
# Verify installations
node --version
npm --version
```

### 4. Clone and Setup Project
```bash
# Clone using SSH URL instead of HTTPS
git clone git@github.com:jamesbeeson01/Chat-Interface.git
cd Chat-Interface
npm install
```

### 5. Create and Configure systemd Service
If you are unsure of your username, run `whoami`

Create the service file:
```bash
sudo nano /etc/systemd/system/chatapp.service
```

This opens a text editor. Paste the following content:
```ini
[Unit]
Description=Chat Interface Node.js Application
After=network.target

[Service]
Environment=PORT=3000
Environment=GEMINI_API_KEY=AIzaSyBcCaUUXj4s6YYrRcXC7AGOrRbKNDrN7iQ
Type=simple
User=bee23011
WorkingDirectory=/home/bee23011/Chat-Interface
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

To save in nano:
- Press `Ctrl + X` to exit
- Press `Y` to confirm you want to save
- Press `Enter` to confirm the filename

Enable and start the service:
```bash
sudo systemctl enable chatapp
sudo systemctl start chatapp
sudo systemctl status chatapp  # verify it's running
```

### 6. Install and Configure SSL
```bash
# Install nginx and certbot
sudo apt-get install nginx
sudo apt-get install certbot python3-certbot-nginx

# Configure nginx to proxy requests to your Node.js app
sudo nano /etc/nginx/sites-available/default
```

Replace the contents with:
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name tutor-chat.space www.tutor-chat.space;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Test and reload nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d tutor-chat.space -d www.tutor-chat.space
```

## Development

To run the application locally:

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:3000`

## Environment Variables

The application requires the following environment variables:
- `PORT`: The port number (defaults to 3000)
- `GEMINI_API_KEY`: Your Google Gemini API key

## Features

- Real-time chat interface
- AI-powered responses using Google's Gemini
- Message history tracking
- Survey integration

## Updating the Application

First, SSH the VM, and push any changes to the database
```bash
cd Chat-Interface
git add .
git commit -m"New db entries"
git push
```

Then, process the changes locally
```bash
git pull
git add .
git commit -m"Whatever"
git push
```

Then, return to the SSH and pull changes
```bash
git pull
```

If you have issues with chat.db conflicts,
```bash
# Cloud SSH
git checkout --ours chat.db

# Local
git checkout --theirs chat.db
```

The reason for the above is that the server data in the database is the actual experiement data, not test data. The server data should be kept at all costs.

If there are any new dependencies, install them
```bash
npm install
```

To apply changes, restart the app
```bash
# Restart the service to apply changes
sudo systemctl restart chatapp

# Verify the service is running
sudo systemctl status chatapp
```

Alternatively, kill the node process and it will restart
```bash
ps aux | grep node # to get process number for node
kill 2022622 # or whatever number is shown 
```

### Pulling Updates
To update the application with the latest changes from GitHub:

```bash
# Navigate to the application directory
cd /var/www/Chat-Interface

# Fetch the latest changes
git fetch origin

# Pull the changes (assuming you're on the main branch)
git pull origin main

# Install any new dependencies
npm install

# Restart the service to apply changes
sudo systemctl restart chatapp

# Verify the service is running
sudo systemctl status chatapp
```

Note: If you've made any local changes, you may need to stash or commit them first:
```bash
git stash  # temporarily store local changes
git pull origin main  # pull updates
git stash pop  # reapply local changes
```

### Pushing Changes
To push your changes back to GitHub:

```bash
# Check what files have changed
git status

# Stage your changes (example with specific files)
git add app.js database.js
# Or stage all changes
git add .

# Commit your changes
git commit -m "Description of your changes"

# Push to GitHub
git push origin main
```

### skip-worktree with chat.db

To allow a chat.db template in the public repo without it committing or pulling updates for chat.db, I ran this on my local machine:

```bash
git update-index --skip-worktree chat.db
```

This allows that exact behavior, cloning the template chat.db initially from github, but not pulling or pushing and updates. If I do need to push or pull an update, I can run the following

```bash
git update-index --no-skip-worktree chat.db
git pull  # or push
git update-index --skip-worktree chat.db
```

Note: The database schema is defined in `database.js` and will be automatically applied when the application starts. The `chat.db` file contains your conversation data and will be synced with GitHub when you push changes.
