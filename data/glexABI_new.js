// 사용 X.  glexABI.js를 사용하세요

// const ABI = [

// 	{

// 		"constant": false,

// 		"inputs": [],

// 		"name": "applyMasternode",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "bool"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "nonpayable",

// 		"type": "function"

// 	},

// 	{

// 		"constant": false,

// 		"inputs": [

// 			{

// 				"name": "_user",

// 				"type": "address"

// 			},

// 			{

// 				"name": "_mnCnt",

// 				"type": "uint256"

// 			}

// 		],

// 		"name": "applyMasternode2",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "bool"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "nonpayable",

// 		"type": "function"

// 	},

// 	{

// 		"constant": false,

// 		"inputs": [],

// 		"name": "closeMNandWithdrawl",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "nonpayable",

// 		"type": "function"

// 	},

// 	{

// 		"constant": false,

// 		"inputs": [

// 			{

// 				"name": "_startNum",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "_endNum",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "_period",

// 				"type": "uint256"

// 			}

// 		],

// 		"name": "dailyReward",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "nonpayable",

// 		"type": "function"

// 	},

// 	{

// 		"constant": false,

// 		"inputs": [

// 			{

// 				"name": "_recipient",

// 				"type": "address"

// 			},

// 			{

// 				"name": "_amount",

// 				"type": "uint256"

// 			}

// 		],

// 		"name": "glexTransfer",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "nonpayable",

// 		"type": "function"

// 	},

// 	{

// 		"constant": false,

// 		"inputs": [

// 			{

// 				"name": "_addr",

// 				"type": "address"

// 			}

// 		],

// 		"name": "setGLEXtoken",

// 		"outputs": [],

// 		"payable": false,

// 		"stateMutability": "nonpayable",

// 		"type": "function"

// 	},

// 	{

// 		"constant": false,

// 		"inputs": [

// 			{

// 				"name": "_amount",

// 				"type": "uint256"

// 			}

// 		],

// 		"name": "withdraw",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "nonpayable",

// 		"type": "function"

// 	},

// 	{

// 		"constant": false,

// 		"inputs": [],

// 		"name": "withdrawEth",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "bool"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "nonpayable",

// 		"type": "function"

// 	},

// 	{

// 		"constant": false,

// 		"inputs": [

// 			{

// 				"name": "_amount",

// 				"type": "uint256"

// 			}

// 		],

// 		"name": "withdrawGLEXbalance",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "bool"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "nonpayable",

// 		"type": "function"

// 	},

// 	{

// 		"constant": false,

// 		"inputs": [],

// 		"name": "withdrawMasterNode",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "nonpayable",

// 		"type": "function"

// 	},

// 	{

// 		"inputs": [],

// 		"payable": false,

// 		"stateMutability": "nonpayable",

// 		"type": "constructor"

// 	},

// 	{

// 		"payable": true,

// 		"stateMutability": "payable",

// 		"type": "fallback"

// 	},

// 	{

// 		"constant": true,

// 		"inputs": [],

// 		"name": "deployTime",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "view",

// 		"type": "function"

// 	},

// 	{

// 		"constant": true,

// 		"inputs": [],

// 		"name": "getBalanceInfo",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "view",

// 		"type": "function"

// 	},

// 	{

// 		"constant": true,

// 		"inputs": [

// 			{

// 				"name": "_user",

// 				"type": "address"

// 			}

// 		],

// 		"name": "getBalanceOf",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "view",

// 		"type": "function"

// 	},

// 	{

// 		"constant": true,

// 		"inputs": [],

// 		"name": "getCurrentReward",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "view",

// 		"type": "function"

// 	},

// 	{

// 		"constant": true,

// 		"inputs": [

// 			{

// 				"name": "_addr",

// 				"type": "address"

// 			}

// 		],

// 		"name": "getEachUserReward",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "view",

// 		"type": "function"

// 	},

// 	{

// 		"constant": true,

// 		"inputs": [],

// 		"name": "getMyBalance",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "view",

// 		"type": "function"

// 	},

// 	{

// 		"constant": true,

// 		"inputs": [],

// 		"name": "getMyInfo",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "view",

// 		"type": "function"

// 	},

// 	{

// 		"constant": true,

// 		"inputs": [],

// 		"name": "getOwner",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "address"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "view",

// 		"type": "function"

// 	},

// 	{

// 		"constant": true,

// 		"inputs": [],

// 		"name": "getTotalMNcount",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "view",

// 		"type": "function"

// 	},

// 	{

// 		"constant": true,

// 		"inputs": [],

// 		"name": "getTotalSupply",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "view",

// 		"type": "function"

// 	},

// 	{

// 		"constant": true,

// 		"inputs": [],

// 		"name": "getTotalUsersReward",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "view",

// 		"type": "function"

// 	},

// 	{

// 		"constant": true,

// 		"inputs": [

// 			{

// 				"name": "_user",

// 				"type": "address"

// 			}

// 		],

// 		"name": "getUserInfo",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "view",

// 		"type": "function"

// 	},

// 	{

// 		"constant": true,

// 		"inputs": [

// 			{

// 				"name": "_index",

// 				"type": "uint256"

// 			}

// 		],

// 		"name": "getUserInfoByIndex",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "address"

// 			},

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "view",

// 		"type": "function"

// 	},

// 	{

// 		"constant": true,

// 		"inputs": [],

// 		"name": "getUsersLength",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "view",

// 		"type": "function"

// 	},

// 	{

// 		"constant": true,

// 		"inputs": [],

// 		"name": "glexToken",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "address"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "view",

// 		"type": "function"

// 	},

// 	{

// 		"constant": true,

// 		"inputs": [],

// 		"name": "tokenPerMN",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "view",

// 		"type": "function"

// 	},

// 	{

// 		"constant": true,

// 		"inputs": [],

// 		"name": "totalMNcount",

// 		"outputs": [

// 			{

// 				"name": "",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "view",

// 		"type": "function"

// 	},

// 	{

// 		"constant": true,

// 		"inputs": [

// 			{

// 				"name": "",

// 				"type": "address"

// 			}

// 		],

// 		"name": "user",

// 		"outputs": [

// 			{

// 				"name": "mnCnt",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "tokenCnt",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "applyTime",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "totalReward",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "unPayedReward",

// 				"type": "uint256"

// 			},

// 			{

// 				"name": "payedReward",

// 				"type": "uint256"

// 			}

// 		],

// 		"payable": false,

// 		"stateMutability": "view",

// 		"type": "function"

// 	}

// ];

// module.exports = ABI; 