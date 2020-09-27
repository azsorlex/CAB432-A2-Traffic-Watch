# CAB432-A2-Alex-Ethan
A NodeJS application which uses OpenCV to capture the feed of numerous public webcams and count the number of vehicles in frame. This was deployed to AWS and utilised EC2 load balancing, Elasticache and S3.

# Usage
## Installation
Before doing anything, OpenCV has to be installed locally. Visit [this website](https://docs.opencv.org/master/df/d65/tutorial_table_of_content_introduction.html) and find and follow the appropriate installation instructions. Once that's done, run ```npm install```

## API Keys
The Google Maps Javascript and QLDTraffic GeoJSON APIs are used in this application, and their API keys are required for this application to work.  Copy ".env.sample", rename it as ".env", and then appropriately add the keys into .env.