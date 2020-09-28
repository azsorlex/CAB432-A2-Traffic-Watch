FROM node:erbium

COPY . .

RUN apt-get update && apt-get full-upgrade -y && apt-get install -y build-essential cmake git
RUN npm install

EXPOSE 3000
CMD ["npm", "start"]