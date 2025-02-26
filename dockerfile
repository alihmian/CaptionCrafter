# Use Debian-based Node image for better compatibility
FROM node:18-bullseye

# Install system dependencies for Python and C extensions
RUN apt-get update && apt-get install -y \
    python3 python3-venv python3-pip \
    build-essential \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    libwebp-dev \
    libtiff5-dev \
    libopenjp2-7-dev \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install


# Copy Python requirements file
COPY requirements.txt .

# Create virtual environment and install Python dependencies
RUN python3 -m venv /venv && \
    /venv/bin/pip install --no-cache-dir -r requirements.txt

# Set environment variables
ENV PATH="/venv/bin:$PATH"

# Copy application files
COPY . .

# Command to run the bot
CMD ["npx", "ts-node", "src/index.ts"]
