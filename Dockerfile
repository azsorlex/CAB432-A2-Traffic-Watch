FROM node

COPY . /opt
WORKDIR /opt

RUN apt-get update && apt-get install -y build-essential cmake git
RUN npm install

EXPOSE 3000
CMD ["npm", "start"]