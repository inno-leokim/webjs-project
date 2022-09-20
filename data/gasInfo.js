const request = require('request-promise-native');


module.exports = request('https://ethgasstation.info/json/ethgasAPI.json')
                .then((result) => { 
                    return result;
                })
                

 

    





