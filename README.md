# CAB432-A2-Traffic-Watch
A NodeJS application written by Alexander Rozsa and Ethan Knight which uses OpenCV to capture the feed of numerous public webcams and count the number of vehicles in-frame.  This was deployed to AWS and utilised EC2 load balancing, ElastiCache and S3.

# Usage
## Installation
Before running ```npm install```, certain packages have to be already installed for it to work. These packages and the installation processes behind them depend on the OS used.

### Ubuntu
Run ```sudo apt install build-essential cmake git```.

### Windows
Install [Git](https://git-scm.com/) and [CMake](https://cmake.org/download/). For CMake, make sure it's added to the path during installation. Then run ```npm install --g windows-build-tools``` within an administrator PowerShell window.

## API Keys
The Google Maps Javascript and QLDTraffic GeoJSON APIs are used in this application, and their API keys are required for this application to work.  Copy ".env.sample", rename it as ".env", and then appropriately add the keys into .env.
