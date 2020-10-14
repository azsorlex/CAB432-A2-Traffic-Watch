# CAB432-A2-Traffic-Watch
A NodeJS application written by Alexander Rozsa and Ethan Knight which uses TensorFlow.js to capture the feed of numerous public webcams and count the number of vehicles in-frame.  This was deployed to AWS and utilised EC2 load balancing, ElastiCache and S3.

# API Keys
The Google Maps Javascript and QLDTraffic GeoJSON APIs are used in this application, and their API keys are required for this application to work. Copy ".env.sample", rename it as ".env", and then appropriately add the keys into .env.

# Usage
After running ```npm start```, the application can be accessed at ```localhost:3000```. 
