# d3 api timeline controller
 An auto generated cuestack from Disguise's new api in [r25.0.3](https://www.disguise.one/download/)

 ## THIS REQUIRES R25 OR NEWER TO FUNCTION

 This software is a nodejs server that queries the d3 server with a running project and constructs a cuelist based on the time of each notation. You can search the stack and filter by track. Clicking on an annotation tells the d3 server to jump to the specified time. By default this opens a server at port 3000 on the device its run on and can be accessed with any connected network interface.

## To install

Get Nodejs installed on your computer from [Node JS](https://nodejs.org/en) (LTS is fine), Clone this repo, navigate to the project directory, run *npm install* then *npm start* in your terminal. Voila, your server should now be running [here](http://localhost:3000)

## Todo
Write a better install guide  
Allow control of all transports with an all option in the dropdown menu.