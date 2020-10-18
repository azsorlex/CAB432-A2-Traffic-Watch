# CAB432-A2-Traffic-Watch
A NodeJS application written by Alexander Rozsa and Ethan Knight which uses TensorFlow.js to capture the feed of numerous public webcams and count the number of vehicles in-frame.  This was deployed to AWS and utilised EC2 load balancing, ElastiCache and S3.

# API Keys
The Google Maps Javascript and QLDTraffic GeoJSON APIs are used in this application, and their API keys are required for this application to work. Copy ".env.sample", rename it as ".env", and then appropriately add the keys into .env.

# Redis
Our application uses AWS ElastiCache when deployed onto AWS, which doesn't work when running this application locally. Line 23 of tensorflow.js can be replaced with line 22 to utilise a local Redis installation.

# Usage
After running ```npm start```, the application can be accessed at ```localhost:3000```. 
