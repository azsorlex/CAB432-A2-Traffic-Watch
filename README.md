# CAB432-A2-Alex-Ethan
A NodeJS application which uses OpenCV to capture the feed of numerous public webcams and count the number of vehicles in frame. This was deployed to AWS and utilised EC2 load balancing, ElastiCache and S3.

# Usage
## Installation
Before running ```npm install```, certain packages have to be already installed for it to work. These packages depend on the OS used.

###### Ubuntu
```build-essential cmake git```. This can be seen in the Dockerfile.

###### Arch Linux


###### Windows


## API Keys
The Google Maps Javascript and QLDTraffic GeoJSON APIs are used in this application, and their API keys are required for this application to work.  Copy ".env.sample", rename it as ".env", and then appropriately add the keys into .env.