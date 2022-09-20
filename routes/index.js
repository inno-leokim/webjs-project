/**
 * GLEX 메인 api 서버 : 115.68.235.42 
 */
const fs = require('fs');
const fsPromises = fs.promises;
const express = require('express');
const winston = require('../winston/logger');
const router = express.Router();
const cron = require('node-cron');
const Web3 = require('web3');
const jwt = require("jsonwebtoken");
const web3 = new Web3('http://115.68.235.42:8545'); //메인넷-geth
const infura = "https://mainnet.infura.io/v3/5b80fdeaad58486895035c1470352b71" //메인넷-infura
const web3_infura = new Web3(new Web3.providers.HttpProvider(infura));
const GLEX_ABI = require('../data/glexABI');
const GLEX_TOKEN_ABI = require('../data/glexTokenABI');

// const GLEX_ABI_new = require('../data/glexABI_new');

const dbConn = require('../data/dbconfig');
const secretObj = require("../data/jwt");
const ownerPW   = require("../data/important");
const resMsg    = require("../data/resMsg");
const gasInfo   = require("../data/gasInfo");

// pushConf, request : 오너 이더 잔량 부족 푸시 알람 관련 변수
const pushConf  = require("../data/pushConf");
const request = require('request-promise-native');

// const contract = "0x84fd0c4ec84e95d94756dde8147519fbea5ffeea"; //메인넷 기존 계약주소

const contract = "0xd5ca85d395a973b2a3e044c2780b9968767c5da0"; //메인넷 보상 계약주소

const GLEXTokenAddr = "0x5b28ce9b710ea83aa27c6d6c8d5251ed006d2e38"; //glex 새 토큰주소

const owner = "0x81e77f4d5c8ad0ea7c9f59dd43ac16001e07dd46"; //메인넷 오너

const keystoryeDir  = "/home/pine/.ethereum/keystore/"; //keystore 파일 저장 폴더

//보상계약
const GLEXtoken = new web3_infura.eth.Contract(GLEX_ABI, contract,{
	from: owner,
	// gasPrice: '50000000000'
});
// 모든(GLEX, ETH) 수량을 web3.utils.fromWei를 사용하여 소숫점(18자리) 처리 하였다.


const GLEXTokenContract = new web3_infura.eth.Contract(GLEX_TOKEN_ABI, GLEXTokenAddr,{
	from: owner,
	// gasPrice: '50000000000'
});


// const GLEXtoken_new = new web3_infura.eth.Contract(GLEX_ABI_new, contract_new,{
// 	from: owner,
// 	gasPrice: '10000000000'
// });

/**
 * 수수료 테이블
 */
// const feeTable = {
//     SG : '0.0045', //토큰전송 
//     SE : '0.0022', //이더전송 
//     MA : '0.0657', //마스터노드 신청
//     MW : '0.041',  //마스터노드 해지
//     RW : '0.01211'  //보상 출금
// }


/**
 * wait(시간) 함수
 */
const wait = (microsec) => {
    let start = new Date().getTime();
    let cur = start;
    while(cur - start < microsec)
    {
        cur = new Date().getTime();
    }
}

//타임스탬프 구하는 함수 
const toTimestamp = (strDate) => {
    let datum = Date.parse(strDate);
    return datum;
}

//db 쿼리 동기식 작동 함수
const queryExec = sql => new Promise ((resolve, reject) => {
    dbConn.query(sql, (err, res) => {
        err ? reject(err) : resolve(res)
    });
});

const showResult = ( userId='', result, category) => {

    return {
        "category" : category,
        "code" : "0000",
        "userID" : userId,
        "status" : "success",
        "msg"    : "트랜잭션 성공",
        "trResult" : {
            "status"          : result.status,
            "blockHash"       : result.blockHash,
            "blockNumber"     : result.blockNumber,
            "transactionHash" : result.transactionHash,
            "from"            : result.from,
            "gasUsed"         : result.gasUsed  
        }
    };
}

/**
 * 로그인 토큰생성 함수
 */
const makeToken = (id, pw) => { 
  
  const rows = dbConn.query('SELECT * FROM member WHERE member_id=? AND member_password=?',[id,pw]); 

 if(rows.values){
    // let token = jwt.sign(
    //   {
    //     id : id
    //   },
    //   secretObj.secret,
    //   {
    //     expiresIn:'1m'
    //   }
    // );

    let token = jwt.sign(
        {
          id : id
        },
        secretObj.secret,
        {}
    );

    return token;

  }else{
    return "not";
  }

};

/**
 * randomString():
 * 수동으로 이더 계정 생성 시 비번을 만들어 주기 위한 함수
 */
const randomString = () => {
    let chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    let string_length = 8;
    let randomstring = '';
    for (let i=0; i<string_length; i++) {
        let rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum,rnum+1);
    }
    
    return randomstring;
}

/**
 * 함수명 : getPKandNonce
 * 파라미터 : 계정주소
 * raw 트랜잭션을 위한 private key와 nonce를 구함
 */

const getPKandNonce = async (_account) => {
    
    let userTxInfo = {
        privateKey:'',
        nonce : await web3_infura.eth.getTransactionCount(_account)
    };
    
    let accountLower = _account.toLowerCase().substr(2,_account.length); //0x를 제외한 게정주소(소문자)
    let accountInfo = await queryExec("SELECT w_pw FROM member WHERE w_addr = '"+_account+"'");

    let keystoreFile;
    let keystoreFileJson
    let keystoreFileList = await fs.promises.readdir(keystoryeDir);
    
    for(let i=0; i<keystoreFileList.length; i++){
        if(keystoreFileList[i].includes(accountLower)){
            keystoreFile = keystoreFileList[i];
        }
    }

    keystoreFileJson = JSON.parse(fs.readFileSync(keystoryeDir+keystoreFile,'utf-8'));

    if(_account == owner){
        userTxInfo.privateKey = await web3_infura.eth.accounts.decrypt(keystoreFileJson,ownerPW).privateKey;
    }else{
        userTxInfo.privateKey = await web3_infura.eth.accounts.decrypt(keystoreFileJson,accountInfo[0].w_pw).privateKey;
    }
        
    return userTxInfo;
}

/**
 * 함수명 : txFee(_eth_amount, _userTxInfo, _userID)
 * 파라미터 : 
 *   _eth_amount : 이더 수수료 수량
 *   _userTxInfo : keystore 파일 오프젝트
 *   _userID     : 사용자 ID
 *   _category   : 거래 종류(MA,MW,RW)
 *   _gasPrice   : 가스 가격
 *   _fail_query : 실패 시 DB 실행쿼리
 * MA,MW,RW 거래에 관한 수수료 지급 함수 
 */

const txFee = (_eth_amount, _userTxInfo, _userID, _category, _gasPrice, _fail_query) => new Promise( (resolve, reject) => {
    
    let rawTxForFee = {
        nonce : _userTxInfo.nonce,
        to : contract,
        chainId : 1,
        gas : 50000,
        gasPrice : _gasPrice,
        value : web3_infura.utils.toWei(_eth_amount,"ether")
    }

    web3_infura.eth.accounts.signTransaction(rawTxForFee, _userTxInfo.privateKey)
    .then((result) => {
        console.log(result);

        web3_infura.eth.sendSignedTransaction(result.rawTransaction)
        .then((receipt) =>{

            let tr_result = showResult(_userID, receipt, _category + " 수수료");

            console.log(receipt);
            winston.info(tr_result);

            resolve(_userTxInfo.nonce + 1);
        }).catch((err) => {
            console.log('fee fail!!');
            console.log(err);
            console.log(resMsg(_userID).trErr);
            winston.error(resMsg(_userID).trErr);
            dbConn.query(_fail_query);
            dbConn.query('UPDATE run_check SET run_check = \'false\'',[]);
            reject('fail');
        });
    }).catch((err) => {
            console.log('fee fail');
            console.log(err);
            console.log(resMsg(_userID).trErr);
            winston.error(resMsg(_userID).trErr);
            dbConn.query(_fail_query);
            dbConn.query('UPDATE run_check SET run_check = \'false\'',[]);
            reject('fail');
    });
} )

/** 
 * 함수명 : signTransaction
 * 파라미터 :
 *      _rawTx      : rawTransaction
 *      _privateKey : 사용자 private key
 *      _rowIdx     : DB row index
 *      _member_id  : 사용자 id
 *      _fail_query : 거래 실패 쿼리
 *      _que_table  : transaction_queue 테이블명
 * 트랜잭션 사인 및 전송 
*/
const signTransaction = async (_rawTx, _privateKey, _rowIdx, _member_id, _fail_query, _que_table, _category = "", _mn_uid = "") => {

    await web3_infura.eth.accounts.signTransaction(_rawTx, _privateKey)
    .then((result) => {
        console.log(result);

        dbConn.query('UPDATE '+_que_table+' SET tx_hash=\''+result.transactionHash+'\' WHERE idx='+_rowIdx);

        // if(_category === 'MW'){
        //     dbConn.query('UPDATE glex_masternodes SET active=\'off\' WHERE uid='+_mn_uid);
        // }

        web3_infura.eth.sendSignedTransaction(result.rawTransaction)
        .then((receipt) =>{

            let tr_result = showResult(_member_id, receipt, "glex 전송");
            dbConn.query('UPDATE '+_que_table+' SET status = \'s\', tx_hash=\''+tr_result.trResult.transactionHash+'\' WHERE idx='+_rowIdx);

            console.log(receipt);
            winston.info(tr_result);
        }).catch((err) => {
            console.log('fail');
            console.log(err);
            
            dbConn.query(_fail_query);
            console.log(resMsg(_member_id).trErr);
            winston.error(resMsg(_member_id).trErr);
        });
    }).catch((err) => {
            console.log('fail');
            console.log(err);
            
            dbConn.query(_fail_query);
            console.log(resMsg(_member_id).trErr);
            winston.error(resMsg(_member_id).trErr);
    });

}

/** 
 * 함수명 : signTransactionForOwner
 * 파라미터 :
 *      _contractFunction
 *      _userTxInfo 
 *      _gas     
 *      _gasPrice
 * 트랜잭션 사인 및 전송(오너용)
*/
const signTransactionForOwner = async (_contractFunction, _userTxInfo, _gas, _gasPrice, _res) => {
    
    const functionABI = await _contractFunction.encodeABI();

    let rawTx = {
        nonce : _userTxInfo.nonce,
        to : contract,
        chainId : 1,
        gas : _gas,
        gasPrice : _gasPrice,
        data : functionABI
    }

    await web3_infura.eth.accounts.signTransaction(rawTx, _userTxInfo.privateKey)
    .then((result) => {
        console.log(result);

        
        web3_infura.eth.sendSignedTransaction(result.rawTransaction)
        .then((receipt) =>{
            
            console.log(receipt);
            _res.json(receipt);
            
        }).catch((err) => {
        
            console.log(err);
            _res.json(err);
            
        });
    }).catch((err) => {
        
        console.log(err);
        _res.json(err);
            
    });
}


/* GET home page. */
router.get('/', async (req, res, next) => {
        
    // gasInfo.then((gasRes) => {
    //     console.log(JSON.parse(gasRes));        
    //     res.json((JSON.parse(gasRes).fast + 20).toString() + "00000000");
    // });


    // let ownerinfo = await getPKandNonce(owner);
    // console.log(ownerinfo);

    // console.log(dbConn);

    // dbConn.query('SELECT run_check, regdate FROM run_check',[],(err, result) => {
        
    //     res.json(result);
    // });

    console.log(GLEXTokenContract);
});

// /**
//  * 주소생성
//  * 회원가입시 생성
//  * okspr
//  * 주소, 주소비번만 업데이트
//  */
router.get('/newAccount/:id/:passwd', (req, res, next) => {

    let user_id   = req.params.id;    //DB 업데이트를 받아야 하기 때문에 필요
    let passwd    = req.params.passwd;
    
    web3.eth.personal.newAccount(passwd)
    .then((result) => {
        console.log(result);
        winston.info(result);
        res.json(result);
    });

});

/**
 * 로그인 
 * 보안 토큰 생성
 * ok
 */
router.get('/login/:id/:pw',(req, res, next) => {

    const token = makeToken(req.params.id, req.params.pw); 
    
    winston.info(token);
    res.json(token);

});

// /**
//  * 총 토큰 수량
//  * ok
//  */
router.get('/getTotalSupply', (req, res, next) => {

    GLEXTokenContract.methods.totalSupply().call({from : owner})
    .then((result) => {
        let totalSupply = web3_infura.utils.fromWei(result, 'ether');
        console.log(totalSupply);
        res.json(totalSupply);
    });

});

// /**
//  * 해당 계정의 현재 GLEX 수량 확인 :
//  * 마스터 노드와 관련 없는 현재 자신의 실제 계정에 저장된 토큰 수량   
//  * ok
//  */   
router.get('/getMyBalance/:user_account', (req, res, next) => {
    
    let user_account = req.params.user_account;

    
    GLEXTokenContract.methods.balanceOf(user_account).call({from : user_account}).
    then((result) => {
        console.log(result);
        console.log(parseFloat(web3_infura.utils.fromWei(result, 'ether')).toFixed(2).toString());
        res.json(parseFloat(web3_infura.utils.fromWei(result, 'ether')).toFixed(2).toString());
    })

    // GLEXtoken.methods.getMyBalance().call({from : user_account})
    // .then( (result) => {
    //     console.log(result);
    //     console.log(parseFloat(web3_infura.utils.fromWei(result, 'ether')).toFixed(2).toString());
    //     res.json(parseFloat(web3_infura.utils.fromWei(result, 'ether')).toFixed(2).toString());
    // });
            
});

/**
 *  해당 계정의 현재 이더 잔량 확인 
 */
router.get('/getEthBalance/:user_account', (req, res, next) => {
    
    let user_account = req.params.user_account;

    web3_infura.eth.getBalance(user_account)
    .then((result) => {
        console.log(web3_infura.utils.fromWei(result, 'ether'));
        res.json(web3_infura.utils.fromWei(result, 'ether'));
    });

});

/**
 * 현재 보상 확인
 * 2020.12 보상 중단
 * ok
 */
router.get('/getCurrentReward', (req, res, next) => {  

    return false;
    GLEXtoken.methods.getCurrentReward().call({from : owner})
    .then((result) => { 
        console.log(web3_infura.utils.fromWei(result, 'ether'));
        res.json(web3_infura.utils.fromWei(result, 'ether'));
    });

});

/**
 * 사용자 자신의 마스터 노드 현황 확인 :
 * 마스터노드, 보상 현황 확인
 * 2020.12 보상 중단
 * ok
 */
router.get('/getMyInfo/:user_account', (req, res, next) => {

    let user_account = req.params.user_account;

    GLEXtoken.methods.getMyInfo().call({from : user_account})
    .then((result) => {
            // result[1] = result[1];
            // result[3] = result[3];  //총 보상 수량
            // result[4] = result[4];  //지불되지 않은 보상
            // result[5] = result[5]; //지불된 보상 수량
            result[0] = "0";
            result[1] = "0";
            result[3] = "0";  //총 보상 수량
            result[4] = "0";  //지불되지 않은 보상
            result[5] = "0"; //지불된 보상 수량
            console.log(result);
            res.json(result);
    });

});

/**
 * glex전송(오너 -> 개인)
 * ok
 */
router.get('/glexTransferOwner/:receiver/:glex',async (req, res, next) => {
    
    //사무실에서만 전송 가능
    const allowIp = ["121.138.110.83", "203.234.108.86", "127.0.0.1"];

    let ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let officeIp = ipAddr.replace("::ffff:",""); 

    if(allowIp.indexOf(officeIp) == -1) {
        console.log(officeIp + ' : 허용되지 않은 ip');
        return false;
    }
    //-----//
    
    let receiver_account = req.params.receiver;
    let glex_amount = parseInt(req.params.glex);
    let gasPrice;

    await gasInfo.then((gasRes) => {
        gasPrice = JSON.parse(gasRes).fast.toString() + "00000000"; 
        console.log(gasPrice);
    });

    const GLEXtk = new web3_infura.eth.Contract(GLEX_ABI,contract, {
        from : owner,
        gasPrice: gasPrice
    });

    const userTxInfo = await getPKandNonce(owner);
       
    console.log(userTxInfo);
        
    let contractFunction = await GLEXtk.methods.glexTransfer(receiver_account,glex_amount);
    
    signTransactionForOwner(contractFunction, userTxInfo, 100000, gasPrice, res);

});

/**
 * 마스터 노드 개별 구축 API
 */
router.get('/applyMN2/:addr/:mnCnt', async (req, res, next) => {

    //사무실에서만 전송 가능
    const allowIp = ["121.138.110.83", "203.234.108.86", "127.0.0.1"];

    let ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let officeIp = ipAddr.replace("::ffff:",""); 

    if(allowIp.indexOf(officeIp) == -1) {
        console.log(officeIp + ' : 허용되지 않은 ip');
        return false;
    }
    //-----//

    let addr = req.params.addr;
    let mnCnt = req.params.mnCnt;
    let gasPrice;

    await gasInfo.then((gasRes) => {
        gasPrice = JSON.parse(gasRes).fast.toString() + "00000000"; 
        console.log(gasPrice);
    });

    const GLEXtk = await new web3.eth.Contract(GLEX_ABI,contract, {
        from : owner,
        gasPrice: gasPrice
    });

    const userTxInfo = await getPKandNonce(owner);

    console.log(userTxInfo);

    let contractFunction = await GLEXtk.methods.applyMasternode2(addr, mnCnt);

    signTransactionForOwner(contractFunction, userTxInfo, 650000, gasPrice, res);
});


/**
 * 마스터 노드 정보 수정 API
 */
router.get('/modUserMNstatus/:addr/:mnCnt/:totalReward', async (req, res, next) => {

    //사무실에서만 전송 가능
    const allowIp = ["121.138.110.83", "203.234.108.86", "127.0.0.1"];

    let ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let officeIp = ipAddr.replace("::ffff:",""); 

    if(allowIp.indexOf(officeIp) == -1) {
        console.log(officeIp + ' : 허용되지 않은 ip');
        return false;
    }
    //-----//

    let addr = req.params.addr;
    let mnCnt = req.params.mnCnt;
    let totalRW = req.params.totalReward;

    let gasPrice;

    await gasInfo.then((gasRes) => {
        gasPrice = JSON.parse(gasRes).fast.toString() + "00000000"; 
        console.log(gasPrice);
    });

    const GLEXtk = await new web3_infura.eth.Contract(GLEX_ABI,contract, {
        from : owner,
        gasPrice: gasPrice
    });

    const userTxInfo = await getPKandNonce(owner);

    console.log(userTxInfo);

    let contractFunction = await GLEXtk.methods.modUserMNstatus(addr, mnCnt, totalRW);

    signTransactionForOwner(contractFunction, userTxInfo, 500000, gasPrice, res);
});


/**
 * SG : glex 전송
 * SE : 이더 전송
 * MA : 마스터노드 신청
 * MW : 마스터노드 부분해지   
 * RW : 보상출금
 */
cron.schedule('* * * * *', (req, res, next) => {

    const que_table = 'transaction_queue';
    
    let glex_amount;
    let receiver_account;
    let isRun;    
    let gasPrice;
    let rawTx;
    let contractFunction;
    let functionABI;
    let nextNonce;

    

    dbConn.query('SELECT run_check, regdate FROM run_check',[],(err, result) => {
        
        if(!result){
            console.log('DB 연결 에러');
            return false;
        }

        isRun = result[0].run_check;            

        if(isRun == 'true'){
            
            let currentTime =+ (new Date() / 1000).toFixed(0); //현재시간
            let lastUpdateTime = result[0].regdate; //run_check 필드가 true로 변경된 시간
            let lastUpdateTime_s = toTimestamp(lastUpdateTime) / 1000;

            console.log(currentTime - lastUpdateTime_s);
            if((currentTime - lastUpdateTime_s) < 900){
                console.log('former transactions running...'); 
                return false;
            }else{
                dbConn.query('UPDATE run_check SET run_check = \'false\'',[]);
                return false;
            }            
        }
        
        dbConn.query('SELECT * FROM '+que_table+' WHERE status = \'w\'',[],async (err, row) => {

            await gasInfo.then((gasRes) => {
                gasPrice = (JSON.parse(gasRes).fast + 10).toString() + "00000000";
                console.log(gasPrice);
            });

            const GLEXtkContract = new web3_infura.eth.Contract(GLEX_TOKEN_ABI,GLEXTokenAddr, {
                from : owner,
                gasPrice: gasPrice
            });

            await dbConn.query('UPDATE run_check SET run_check = \'true\'',[]);
        
            for(let i=0; i<row.length; i++){

                const userTxInfo = await getPKandNonce(row[i].w_addr);
                const fail_query        = 'UPDATE '+que_table+' SET status = \'f\' WHERE idx='+row[i].idx;
                const pending_query     = 'UPDATE '+que_table+' SET status = \'p\' WHERE idx='+row[i].idx;

                dbConn.query(pending_query);

                //일시적 거래 중지 : 가스값 급상승 같은 특이사항 발생시 실행
                // await queryExec(fail_query);
                // return false;

                switch(row[i].category){
                    case "SG" : //glex 전송

                        console.log(row[i].category); 
                        
                        receiver_account = row[i].receiver_addr;
                        glex_amount = (parseInt(row[i].amount) * (10**18)).toString();
                        
                        contractFunction = await GLEXtkContract.methods.transfer(receiver_account,glex_amount);
                        
                        try{
                            functionABI = await contractFunction.encodeABI();
                        }
                        catch(err){
                            console.log(err);
                        }
                        
                        rawTx = {
                            nonce : userTxInfo.nonce,
                            to : GLEXTokenAddr,
                            chainId : 1,
                            gas : 100000,
                            gasPrice : gasPrice,
                            data : functionABI
                        }

                        signTransaction(rawTx, userTxInfo.privateKey, row[i].idx, row[i].member_id, fail_query, que_table);

                        break;

                    case "SE" : //이더 전송
                        console.log(row[i].category); 
                        console.log(userTxInfo.nonce);
                        
                        receiver_account = row[i].receiver_addr;
                        eth_amount = row[i].amount.toString();

                        rawTx = {
                            nonce : userTxInfo.nonce,
                            to : receiver_account,
                            chainId : 1,
                            gas : 50000,
                            gasPrice : gasPrice,
                            value : web3_infura.utils.toWei(eth_amount,"ether")
                        }

                        signTransaction(rawTx, userTxInfo.privateKey, row[i].idx, row[i].member_id, fail_query, que_table);
                        
                        break;

                    // case "MA" : //마스터노드 신청

                    //     console.log(row[i].category); 

                    //     //트랜잭션 수수료 지급
                    //     nextNonce = await txFee('0.00575', userTxInfo, row[i].member_id, 'MA', gasPrice, fail_query);
                    //     console.log(nextNonce);

                    //     console.log('test');
                        
                    //     if(nextNonce == 'fail') { return false; }
                                        
                    //     contractFunction = await GLEXtk.methods.applyMasternode();
                    //     functionABI = await contractFunction.encodeABI();

                    //     rawTx = {
                    //         nonce : nextNonce,
                    //         to : contract,
                    //         chainId : 1,
                    //         gas : 650000,
                    //         gasPrice : gasPrice,
                    //         data : functionABI
                    //     }

                    //     signTransaction(rawTx, userTxInfo.privateKey, row[i].idx, row[i].member_id, fail_query, que_table);

                    //     break;

                    // case "MW" : //마스터 노드 부분해지

                    //     console.log(row[i].category); 
                        
                    //     //트랜잭션 수수료 지급
                    //     nextNonce = await txFee('0.031', userTxInfo, row[i].member_id, 'MW', gasPrice, fail_query);
                    //     console.log(nextNonce);
                        
                    //     if(nextNonce == 'fail') { return false; }

                    //     contractFunction = await GLEXtk.methods.withdrawMasterNode();
                    //     functionABI = await contractFunction.encodeABI();

                    //     rawTx = {
                    //         nonce : nextNonce,
                    //         to : contract,
                    //         chainId : 1,
                    //         gas : 100000,
                    //         gasPrice : gasPrice,
                    //         data : functionABI
                    //     }

                    //     signTransaction(rawTx, userTxInfo.privateKey, row[i].idx, row[i].member_id, fail_query, que_table, row[i].category, row[i].mn_uid);

                    //     break;
                    // case "RW" : //보상출금

                    //     console.log(row[i].category);
                        
                    //     //트랜잭션 수수료 지급
                    //     nextNonce = await txFee('0.00211', userTxInfo, row[i].member_id, 'RW', gasPrice, fail_query);
                    //     console.log(nextNonce);
                        
                    //     if(nextNonce == 'fail') { return false; }

                    //     let amount = parseInt(row[i].amount);

                    //     contractFunction = await GLEXtk.methods.withdraw(amount);
                    //     functionABI = await contractFunction.encodeABI();

                    //     rawTx = {
                    //         nonce : nextNonce,
                    //         to : contract,
                    //         chainId : 1,
                    //         gas : 100000,
                    //         gasPrice : gasPrice,
                    //         data : functionABI
                    //     }

                    //     signTransaction(rawTx, userTxInfo.privateKey, row[i].idx, row[i].member_id, fail_query, que_table);
                   
                    //     break;
                }
            }

            await dbConn.query('UPDATE run_check SET run_check = \'false\'',[]);
            
            console.log('success');
        });
    }); //db run_check 시작 괄호
},{
    scheduled : true,  //true : 크론 실행  false : 크론 정지 
    timezone : 'Asia/Seoul'
});

//마스터노드 일일보상지급 //12시로 변경(이사님 지시)
cron.schedule('30 10 * * *', async () => {
    
    const daily_reward_table = "daily_reward_status";
    let userLength;
    let loopCount;
    let user_mn_info;
    let current_rw; 
    let totalMN;
    let period = 40; //원래 5일
    // let gasPrice;
    let contractFunction;
    let functionABI;
    let rawTx;
    let isSuccess = false;

    // await gasInfo.then((gasRes) => {
    //     gasPrice = (JSON.parse(gasRes).fast + 10).toString() + "00000000";
    //     console.log(gasPrice);
    // });
    
    

    let currentTime =+ (new Date() / 1000).toFixed(0); //현재시간
    let lastRewardTime_ms = await queryExec("SELECT DATE_FORMAT(regdate, '%Y-%m-%d %H:%i:%s') as regdate FROM glex_masternode_log ORDER BY regdate DESC LIMIT 0,1 "); //최근 보상지급 날짜, 시간
    let lastRewardTime_s = toTimestamp(lastRewardTime_ms[0].regdate) / 1000;

    //388800 => 4.5일
    //현재시간 < 388800 => 최근 보상일로부터 5일이 안 지났음
    //현재시간 > 388000 => 최근 보상일로부터 5일이 지났음. 지났으면 보상 토큰 전송
    // 변경
    // 1771200 => 20.5일
    // 현재시간 < 1771200 => 최근 보상일로부터 21일이 안 지났음
    // 현재시간 > 1771200 => 최근 보상일로부터 21일이 지났음. 보상토큰 전송
    if((currentTime - lastRewardTime_s) < 1771200){
        console.log('최근 보상일로부터 21일이 지나지 않았습니다!');
        console.log(currentTime);
        console.log(lastRewardTime_s);
        console.log(currentTime - lastRewardTime_s);
        winston.info('최근 보상일로부터 21일이 지나지 않았습니다!');
        return false;
    }
    
    const GLEXtk = new web3_infura.eth.Contract(GLEX_ABI,contract, {
        from : owner,
        // gasPrice: '30000000000'
    });
    
    await GLEXtk.methods.getUsersLength().call({from : owner})
    .then( (result) => {
    
        // userLength = 360; //테스트용
        userLength = result;
        loopCount = Math.ceil(userLength/20);

        console.log(userLength);
        console.log(loopCount);
    });

    const userTxInfo = await getPKandNonce(owner);

    for(let i=0; i< loopCount; i++){

        let start;

        if(i == 0){
            start = i * 20;
        }else{
            start = (i * 20) + 1;
        }   
        
        let end = (i+1) * 20;

        if(end < userLength){
            end = end;
        }else{
            end = userLength - 1;
        }
        //ownerPW   
        console.log(start+' / '+end);

        contractFunction = await GLEXtk.methods.dailyReward(start, end, period);
        functionABI = await contractFunction.encodeABI();

        rawTx = {
            nonce : userTxInfo.nonce + i,
            to : contract,
            chainId : 1,
            gas : 1200000,
            gasPrice : '45000000000', // ex : 30000000000
            data : functionABI
        }
        // console.log(userTxInfo.nonce + i);
        // console.log(rawTx);

        await web3_infura.eth.accounts.signTransaction(rawTx, userTxInfo.privateKey)
        .then((result) => {

            console.log(result);
            
            queryExec("INSERT INTO "+daily_reward_table+" (tx_hash) VALUES ('"+result.transactionHash+"')");
            
            web3_infura.eth.sendSignedTransaction(result.rawTransaction)
            .then((receipt) =>{

                let tr_result = showResult('',receipt,"일일 보상 지급");

                queryExec('UPDATE '+daily_reward_table+' SET status = \'s\' WHERE tx_hash=\''+result.transactionHash+'\'')

                console.log(tr_result);
                winston.info(tr_result);                

            }).catch((err) => {

                queryExec('UPDATE '+daily_reward_table+' SET status = \'f\' WHERE tx_hash=\''+result.transactionHash+'\'')
                
                console.log(resMsg().trErr);
                winston.error(resMsg().trErr);

            });

        }).catch((err) => {
            
            console.log(resMsg().trErr);
            winston.error(resMsg().trErr);
        })

        if(i < loopCount - 1){
            console.log("메인넷 보상지급 완료!");
            isSuccess = true;
        }
    }

    console.log(isSuccess);
    
    

    if(isSuccess == false){ 
        console.log('fail'); 
        winston.info('일일보상 pending으로 인한 DB 업데이트 실패');
        return false; 
    }
    
    await GLEXtk.methods.getCurrentReward().call({from : owner})
    .then((_current_rw) => {
        current_rw = parseInt(_current_rw);        
    });

    await GLEXtk.methods.totalMNcount().call({from : owner})
    .then((_totalMN) =>{
        totalMN = _totalMN;
    });

    let dailyRewardPerNode = Math.floor((1440 * current_rw / totalMN));  
    let dailyReward = dailyRewardPerNode * period;
    
    for(let i=0; i<userLength; i++){
        let addr;
        
        await GLEXtk.methods.getUserInfoByIndex(i).call({from : owner})
        .then((userRes) => {
            addr = userRes[0];
            console.log(addr);
        });
        
        await GLEXtk.methods.getUserInfo(addr).call({from:owner})
        .then((res) => {
            user_mn_info = res;
            console.log(res);
        });

        console.log(user_mn_info[0]);

        if(user_mn_info[0] != 0){

            let dbUserInfo = await queryExec('SELECT member_id, w_addr FROM member WHERE w_addr =\''+addr+'\'');
            await queryExec('INSERT INTO glex_masternode_log (member_id, w_addr, mn_cnt, daily_reward, reward_amount) VALUES (\''+dbUserInfo[0].member_id+'\',\''+dbUserInfo[0].w_addr+'\','+user_mn_info[0]+','+dailyReward+','+(user_mn_info[0] * dailyReward)+')');
            
            let totalRewardAmountData = await queryExec('SELECT A.member_id as a_member, A.w_addr as a_w_addr, SUM(A.reward_amount) as reward_amount FROM glex_masternode_log A LEFT JOIN member B ON A.member_id = B.member_id WHERE A.w_addr = \''+addr+'\' GROUP BY A.member_id, A.w_addr');
            
            await queryExec('UPDATE member SET total_reward = '+totalRewardAmountData[0].reward_amount+' WHERE w_addr = \''+addr+'\'');

            
            console.log(dbUserInfo[0]);
            console.log(totalRewardAmountData[0]);
            // wait(500);
            if(i == userLength - 1){
                console.log('보상완료');
            }
        }
    }

},{
    scheduled : false,  //true : 크론 실행  false : 크론 정지 
    timezone : 'Asia/Seoul'
});


//pending Transaction 처리 
cron.schedule('*/5 * * * *', async () => {
    
    console.log('pending transaction 검색중 ...');

    let blockNumber;
    let pendingTx = await queryExec("SELECT * FROM transaction_queue WHERE status = 'p' ORDER BY idx DESC");

    for(let i=0; i<pendingTx.length; i++){
        
        if(pendingTx[i].tx_hash){
            
            await web3_infura.eth.getTransaction(pendingTx[i].tx_hash)
            .then((receipt) => {
                console.log(receipt.blockNumber);  
                blockNumber = receipt.blockNumber
            })

            if(blockNumber){
                await queryExec("UPDATE transaction_queue SET status = 's' WHERE idx = " + pendingTx[i].idx);

                if(pendingTx[i].category === 'MW'){
                    await queryExec('UPDATE glex_masternodes SET active=\'off\' WHERE uid='+pendingTx[i].mn_uid);
                }
            }

            console.log(pendingTx[i].tx_hash +' 처리 완료');
        }
    }

},{
    scheduled : true,  //true : 크론 실행  false : 크론 정지 
    timezone : 'Asia/Seoul'
});

//pending daily_reward(일일보상) Transaction 처리 
cron.schedule('*/10 * * * *', async () => {
    
    console.log('pending daily reward transaction 검색중 ...');

    let blockNumber;
    let pendingTx = await queryExec("SELECT * FROM daily_reward_status WHERE status = 'p' ORDER BY idx DESC");

    for(let i=0; i<pendingTx.length; i++){
        
        if(pendingTx[i].tx_hash){
            
            await web3_infura.eth.getTransaction(pendingTx[i].tx_hash)
            .then((receipt) => {
                console.log(receipt.blockNumber);  
                blockNumber = receipt.blockNumber
            })

            if(blockNumber){
                await queryExec("UPDATE daily_reward_status SET status = 's' WHERE idx = " + pendingTx[i].idx);
            }

            console.log(pendingTx[i].tx_hash +' 처리 완료');
        }
    }

},{
    scheduled : true,  //true : 크론 실행  false : 크론 정지 
    timezone : 'Asia/Seoul'
});


//마스터노드 사용자 인덱스 찾기
router.get('/search',(req, res, next) => {
    const GLEXtk = new web3.eth.Contract(GLEX_ABI,contract, {
        from : owner,
        gasPrice: "8000000000"
    });

    let array=[
        "0x2e4adC9AfE572A30c3d925327D103c379C19C8A7", 
    ]
    
    GLEXtk.methods.getUsersLength().call({from : owner})
    .then( async (res)=>{
        for(let i=0; i<res; i++){

            let account;
            let userinfo;

            await GLEXtk.methods.getUserInfoByIndex(i).call({from : owner})
            .then((result) => {
                account = result[0];
            });

            await GLEXtoken_infura.methods.getUserInfo(account).call({from : owner})
            .then((data) => {
               userinfo = data[0]; 
            });

            if(userinfo == '0' || userinfo == 0){

                console.log(account);
                console.log(i);
    
                console.log(userinfo);
            }

            if(i == res -1 ){
                console.log('완료!');
            }
        }
    });
});


//수수료 테이블
router.get('/feeTable', (req, res, next) => {
 
    request('https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=I9S4VFPHCVRDEQS2AXYKPSQMV8YN5Q4PQ7')
    .then((gasRes) => {

        let ethGasInfo = JSON.parse(gasRes);
        let proposeGas = ethGasInfo.result.ProposeGasPrice;
        
        let spendWei_SG = (parseInt(proposeGas + '000000000')) * 1.1 * 55000 * 100;
        let spendEth_SG = parseFloat(web3_infura.utils.fromWei(spendWei_SG.toString(),"ether")) / 100;
        
        let spendWei_SE = (parseInt(proposeGas + '000000000')) * 1.1 * 21000 * 100;
        let spendEth_SE = parseFloat(web3_infura.utils.fromWei(spendWei_SE.toString(),"ether")) / 100;

        // let spendWei_MA = ((parseInt(proposeGas + '000000000')) * 1.1 * 552188) + parseInt(web3_infura.utils.toWei('0.05',"ether"));
        // let spendEth_MA = web3_infura.utils.fromWei(spendWei_MA.toString(),"ether");

        // let spendWei_MW = ((parseInt(proposeGas + '000000000')) * 1.1 * 73000) + parseInt(web3_infura.utils.toWei('0.005',"ether"));
        // let spendEth_MW = web3_infura.utils.fromWei(spendWei_MW.toString(),"ether");

        // let spendWei_RW = ((parseInt(proposeGas + '000000000')) * 1.1 * 94068) + parseInt(web3_infura.utils.toWei('0.00211',"ether"));
        // let spendEth_RW = web3_infura.utils.fromWei(spendWei_RW.toString(),"ether");

        const feeTable = {
            SP : (Math.round(parseFloat(spendEth_SG)*10000)/10000).toString(), //토큰전송 
            SE : (Math.round(parseFloat(spendEth_SE)*10000)/10000).toString(), //이더전송 
            // MA : (Math.round(parseFloat(spendEth_MA)*10000)/10000).toString(), //마스터노드 신청
            // MW : (Math.round(parseFloat(spendEth_MW)*10000)/10000).toString(),  //마스터노드 해지
            // RW : (Math.round(parseFloat(spendEth_RW)*10000)/10000).toString()  //보상 출금
        }
        console.log(feeTable)
        res.json(feeTable);
    });

    // res.json(feeTable);

});

//owner(GLEX, PROT) 이더 수량 체크 배치. 수량 부족시 이사님 폰으로 푸시 알람 전송
cron.schedule('0 13,21 * * *', async (req, res, next) => {

    let fcmUrl = 'https://fcm.googleapis.com/fcm/send';
    
    // 이사님 디바이스 토큰
    let deviceToken = 'czpJt2D7Ji0:APA91bHyxgSFndTDV_AvsTGFWQjxd_abiLTP-4nAvWoBjvrDUG5mxnVZQmdwsNKgZvMjTvjkAlDmdHiEfwjsBWhtKLKkX7BtnH9F-zdhcbaNlCCjnkOV4BOH41xcp9Fwg_EDqzmLSkvf';

    // wjr 테스트 계정 디바이스 토큰
    // let deviceToken = 'cyG-sjOTTGY:APA91bGLKMEuK3R3_Gxh-hBOLeFXarrRx27eJDeO9fmcYHpPsvFFtk8SHHJCrDmMgklmNsUB-QPwH7YBwfVwtHWOGXwgS6f95NN_o8ICFqwlCAlVBT1sfaWNEhzoVUmQCuD3-0QtldBv';
    let protOwner = '0xb29e8d646a53066c78b4c801ef4cd2944fb8dbc7';

    let balance = {
        glex : '',
        prot : ''
    };
    
    await web3_infura.eth.getBalance(owner)
    .then((result) => {
        balance.glex = web3_infura.utils.fromWei(result, 'ether');
        console.log(balance.glex);
    });
    
    await web3_infura.eth.getBalance(protOwner)
    .then((result) => {
        balance.prot = web3_infura.utils.fromWei(result, 'ether');
        console.log(balance.prot);
    });
    
    if(parseFloat(balance.prot) < 0.1 || parseFloat(balance.glex) < 0.1){
        
        let msg  = "glex : " + parseFloat(balance.glex).toFixed(2) + "\n";
            msg += "prot : " + parseFloat(balance.prot).toFixed(2) + "\n\n";

        if(parseFloat(balance.prot) < 0.1) {
            msg += "prot 부족"
        }else if(parseFloat(balance.glex) < 0.1){
            msg += "glex 부족"
        }else{
            msg += "glex, prot 모두 부족"
        }

        let options = {
            uri: fcmUrl,
            methods: 'POST',
            headers:{
                'Authorization': 'key =' + pushConf.GOOGLE_API_KEY,
                'Content-Type' : 'application/json'
            },
            body:{
                notification     : {
                    title : '오너 이더 잔량 체크',
                    body  : msg,
                    vibrate : true,
                    sound : 'default'
                },
                to : deviceToken
            },
            json:true
        }
    
        request.post(options).then((result) => {
            console.log(msg);
            console.log(result);
            winston.info(msg);
            winston.info(result);
        });

    }else{
        winston.info('glex, prot 이더잔량 충분');
        console.log('충분');
    }

},{
    scheduled : true,  //true : 크론 실행  false : 크론 정지 
    timezone : 'Asia/Seoul'
});


router.get('/filemv', async (req, res, next) => {

    let keystoreFileList = await fs.promises.readdir(keystoryeDir);
    

    let accountList = await queryExec("SELECT w_addr FROM member");
    let num = 1;
    for(let i=0; i<keystoreFileList.length; i++){
        for(let k=0; k<accountList.length; k++){
            let accountLower = accountList[k].w_addr.toLowerCase().substr(2,accountList[k].length);
            if(keystoreFileList[i].includes(accountLower) && accountLower){
                console.log(keystoreFileList[i]);
                await fsPromises.rename(keystoryeDir+keystoreFileList[i],'/home/pine/.ethereum/glexKeystore/'+keystoreFileList[i]);
                //console.log(accountLower);
                console.log(num);
                num++;
            }
        }
    }

    res.json(accountList);

});

router.get('/searchIndexMN/', async (req, res, next) => {

    let mnLength;
    let gasPrice;
    let contractFunction;
    let functionABI;
    let rawTx;
    let signTx;

    const userTxInfo = await getPKandNonce(owner);
    
    await gasInfo.then((gasRes) => {
        gasPrice = (JSON.parse(gasRes).fast + 50).toString() + "00000000";
        console.log(gasPrice);
    });

    await GLEXtoken.methods.getUsersLength().call({from : owner})
    .then((result) => {
        mnLength = result;
    });
    
    let num=0;
    for(let i=0; i<mnLength; i++){
        
        // console.log(i);
        console.log('---------------------------------------------------');

        let mnAddr;
        await GLEXtoken.methods.getUserInfoByIndex(i).call({from : owner})
        .then((result) => {
            if(result[1] == 0){

                mnAddr = '';
                console.log(i + " : 마스터 노드 없음");
            }else{
                mnAddr = result[0];
            }
        });

        if(!mnAddr){
            console.log('47번!!!')
        }else{
            console.log(mnAddr);

            contractFunction = await GLEXtoken_new.methods.mnUserPush(mnAddr);
            functionABI = await contractFunction.encodeABI();    
            
            rawTx = {
                nonce : userTxInfo.nonce+i,
                to : contract_new,
                chainId : 1,
                gas : 200000,
                gasPrice : gasPrice,
                data : functionABI
            }

            await web3_infura.eth.accounts.signTransaction(rawTx, userTxInfo.privateKey)
            .then((result) => {

                signTx = result;

                console.log('*****');
                console.log(num);
                num++;

            }).catch((err) => {
                
                console.log(resMsg().trErr);
                winston.error(resMsg().trErr);
            })

            console.log(signTx.rawTransaction);
            
            await web3_infura.eth.sendSignedTransaction(signTx.rawTransaction)
            .then((receipt) =>{
    
                
                console.log(receipt);
                winston.info(receipt);                
    
            }).catch((err) => {            
                
                console.log(resMsg().trErr);
                winston.error(resMsg().trErr);
    
            });
        }
        
        console.log(i);
        console.log('---------------------------------------------------');
        wait(1000);
    }
})

router.get('/modUserMN/', async (req, res, next) => {

    let mnLength;
    let gasPrice;
    let contractFunction;
    let functionABI;
    let rawTx;
    let signTx;

    const userTxInfo = await getPKandNonce(owner);
    
    await gasInfo.then((gasRes) => {
        gasPrice = (JSON.parse(gasRes).fast + 50).toString() + "00000000";
        console.log(gasPrice);
    });

    await GLEXtoken_new.methods.getUsersLength().call({from : owner})
    .then((result) => {
        mnLength = result;
    });
    

    for(let i=0; i<mnLength; i++){
        let mnAddr;
        let userInfo;
        let mnCnt;
        let tokenCnt;
        let applyTime;
        let totalReward;
        let unPayedReward;
        let payedReward;


        console.log(i);
        console.log('---------------------------------------------------');
        
        await GLEXtoken_new.methods.getUserInfoByIndex(i).call({from : owner})
        .then((result) => {

            console.log(result[0])
            mnAddr = result[0];
            // if(result[1] == 0){

            //     mnAddr = '';
            //     console.log(i + " : 마스터 노드 없음");
            // }else{
            //     mnAddr = result[0];
            // }
        });

        await GLEXtoken.methods.getUserInfo(mnAddr).call({from : owner})
        .then((result) => {
            mnCnt         = parseInt(result[0]);
            tokenCnt      = parseInt(web3_infura.utils.fromWei(result[1], 'ether'));
            applyTime     = parseInt(result[2]);
            totalReward   = parseInt(web3_infura.utils.fromWei(result[3], 'ether')); 
            unPayedReward = parseInt(web3_infura.utils.fromWei(result[4], 'ether'));
            payedReward   = parseInt(web3_infura.utils.fromWei(result[5], 'ether'));

        });
        
        console.log(mnAddr)
        console.log(mnCnt,typeof(mnCnt));
        console.log(tokenCnt,typeof(tokenCnt));
        console.log(applyTime,typeof(applyTime));
        console.log(totalReward,typeof(totalReward));
        console.log(unPayedReward,typeof(unPayedReward));
        console.log(payedReward,typeof(payedReward));

        contractFunction = await GLEXtoken_new.methods.addMasterNodeInfo(mnAddr,mnCnt,tokenCnt,applyTime,totalReward,unPayedReward,payedReward);
        functionABI = await contractFunction.encodeABI();

        rawTx = {
            nonce : userTxInfo.nonce+i,
            to : contract_new,
            chainId : 1,
            gas : 200000,
            gasPrice : gasPrice,
            data : functionABI
        }

        await web3_infura.eth.accounts.signTransaction(rawTx, userTxInfo.privateKey)
        .then((result) => {

            signTx = result;
            // console.log(signTx);
            console.log('*****');
            
        }).catch((err) => {
            
            console.log(resMsg().trErr);
            winston.error(resMsg().trErr);
        })

        console.log(signTx.rawTransaction);

        await web3_infura.eth.sendSignedTransaction(signTx.rawTransaction)
        .then((receipt) =>{

            
            console.log(receipt);
            winston.info(receipt);                

            console.log(i);
        }).catch((err) => {            
            
            console.log(resMsg().trErr);
            winston.error(resMsg().trErr);

        });
    }
})

// router.get('/temp/', async (req, res, next) => {

//     let userInfo;
//     let userMnReward = await queryExec("SELECT member_id,w_addr,SUM(reward_amount) AS total, (SELECT mn_cnt FROM glex_masternode_log WHERE A.w_addr = w_addr AND DATE(regdate) = '2020-04-13') AS mn_cnt FROM `glex_masternode_log` A WHERE DATE(regdate) != '2020-04-13' GROUP BY w_addr");

//     res.json(userMnReward.length);

//     let cnt = 1;

//     for(let i=0; i<userMnReward.length; i++){

//         await GLEXtoken.methods.getUserInfo(userMnReward[i].w_addr).call({from:owner})
//         .then((res) => {

//             if(res[0] > 0){
//                 userInfo = res;
//                 // console.log(userMnReward[i].w_addr, ' : ', res[3], userMnReward[i].total, parseInt(res[3] - userMnReward[i].total) ,' / ', userMnReward[i].mn_cnt);

//                 console.log(cnt);
//                 cnt++; 
//                 console.log(userInfo);

//                 queryExec("UPDATE glex_masternode_log SET reward_amount = "+parseInt(res[3] - userMnReward[i].total)+" WHERE DATE(regdate) = '2020-04-13' AND w_addr = '"+userMnReward[i].w_addr+"'" );
//             }
//         });

//         if(i == userMnReward.length - 1){
//             console.log('완료');
//         }
//         wait(1000);
//     }

// });

router.get('/glex/status', async (req, res, next) => {
    
    let userLength;
    let totalMNcount;
    let realMNuser = 0;
    let dbCheck;
    let infuraCheck = GLEXtoken._requestManager.provider.connected;
    let gethCheck = web3._requestManager.provider.connected;

    // console.log(infuraCheck);
    // console.log(gethCheck);

    try{
        dbCheck = await queryExec("SELECT 'ok' ");
    }catch(e){
        dbCheck = e;
    }

    await GLEXtoken.methods.getTotalMNcount().call({from : owner})
    .then( (result) => {
        totalMNcount = result;
    });

    await GLEXtoken.methods.getUsersLength().call({from : owner})
    .then( (result) => {
        userLength = result;
    });
    
    for(let i=0; i<userLength; i++){
        await GLEXtoken.methods.getUserInfoByIndex(i).call({from : owner})
        .then( (result) => {

            if(result['1'] != 0){
                realMNuser += 1;
            }
        })
    }

    console.log(totalMNcount);
    console.log(realMNuser);

    res.render('index', {
        totalMN    : totalMNcount,
        realMNuser : realMNuser ,
        feeSG      : feeTable.SG,
        feeSE      : feeTable.SE,
        feeMA      : feeTable.MA,
        feeMW      : feeTable.MW,
        feeRW      : feeTable.RW,
        dbStatus   : dbCheck.code,
        infuraStatus : infuraCheck,
        gethStatus : gethCheck,
        owner : owner,
        contract : contract
    })
});

// 임시 api
router.get('/totalReward', async (req, res, next) => {

    let totalReward = 0;
    let userLength = await GLEXtoken.methods.getUsersLength().call({from : owner});

    for(var i=0; i<userLength; i++){
        
        let addr;
        
        await GLEXtoken.methods.getUserInfoByIndex(i).call({from : owner})
        .then((userRes) => {
            addr = userRes[0];
            console.log(addr);
        });

        await GLEXtoken.methods.getUserInfo(addr).call({from:owner})
        .then((res) => {
            user_mn_info = res;
            console.log(res[3]);
            totalReward += parseInt(res[3]); 
        });

    }
    console.log('---끝---');
    console.log('총 보상 : ' + totalReward);
});

router.get('/totalUnpayedReward', async (req, res, next) => {

    let totalReward = 0;
    let userLength = await GLEXtoken.methods.getUsersLength().call({from : owner});

    for(var i=0; i<userLength; i++){
        
        let addr;
        
        await GLEXtoken.methods.getUserInfoByIndex(i).call({from : owner})
        .then((userRes) => {
            addr = userRes[0];
            console.log(addr);
        });

        await GLEXtoken.methods.getUserInfo(addr).call({from:owner})
        .then((res) => {
            user_mn_info = res;
            console.log(res[4]);
            totalReward += parseInt(res[4]); 
        });

    }
    console.log('---끝---');
    console.log('총 남은 보상 : ' + totalReward);
});

router.get('/totalPayedReward', async (req, res, next) => {

    let totalReward = 0;
    let userLength = await GLEXtoken.methods.getUsersLength().call({from : owner});

    for(var i=0; i<userLength; i++){
        
        let addr;
        
        await GLEXtoken.methods.getUserInfoByIndex(i).call({from : owner})
        .then((userRes) => {
            addr = userRes[0];
            console.log(addr);
        });

        await GLEXtoken.methods.getUserInfo(addr).call({from:owner})
        .then((res) => {
            user_mn_info = res;
            console.log(res[5]);
            totalReward += parseInt(res[5]); 
        });

    }
    console.log('---끝---');
    console.log('총 지급된 보상 : ' + totalReward);
});

router.get('/userbalance', async(req, res, next) => {
    let file = 'userlist.txt';
    let file2 = 'userlist2.txt';
    let userLength;
    let userList = [];
    // let mnUserCnt = 0;
    await GLEXtoken.methods.getUsersLength().call({from : owner})
    .then( (result) => {
        userLength = parseInt(result);

        // console.log(userLength + ' ' + typeof(userLength))
    });
    
    for(let i=0; i<userLength; i++){
        
        let userAddr;
        let userArr = [];
        await GLEXtoken.methods.getUserInfoByIndex(i).call({from : owner})
        .then( (result) => {
            // console.log(result[0]);
            userAddr = result[0];

            userArr.push(result[0]);
        });       

        await GLEXtoken.methods.getBalanceOf(userAddr).call({from : owner})
        .then( (result) => {
            // console.log(result);
            userArr.push(result);
        });

        await GLEXtoken.methods.getUserInfo(userAddr).call({from : owner})
        .then( (result) => {
            userArr.push(result[0],result[1],result[3],result[4],result[5]);
            // console.log(result);
        });

        userList.push(userArr);

        
        // console.log(userArr);
        if(i === (userLength-1)) console.log('end');
    }

    // for(let i=0; i<userList.length; i++){
    //     fs.open(file, 'w', (err,fd) => {
    //         if(err) throw err;
            
    //         fs.appendFile(file,userList[i].join()+'\n', 'utf-8',(err)=>{
    //             console.log('write end!');
    //         })
    //     })
    // }
    // console.log(userList);  
    
    // let accountInfo = await queryExec("SELECT w_addr FROM member WHERE w_addr = '"+_account+"'");
    console.log('------------------------------------');
    console.log('------------------------------------');
    
    let accountInfo = await queryExec("SELECT w_addr FROM `member` WHERE member_id NOT LIKE '%test%'");

    let accountInfoArr = [];

    for(let i=0; i<accountInfo.length; i++){
        accountInfoArr.push(accountInfo[i].w_addr);
    }
    

    let userAddrList = [];
    for (let i=0; i<userList.length; i++){
        
        userAddrList.push(userList[i][0]);
    }

    
    let unincludeAddr = [];
    for(let k=0; k< accountInfoArr.length;k++){
        if(userAddrList.indexOf(accountInfoArr[k]) == -1){
            unincludeAddr.push(accountInfoArr[k]);
            // console.log(`${k} : ${accountInfoArr[k]}`);
        }
    }

    let unincludeAddrList = [];

    for(let i=0; i<unincludeAddr.length; i++){
        let eachInfo = [];
        if(unincludeAddr[i]){
            await GLEXtoken.methods.getBalanceOf(unincludeAddr[i]).call({from : owner})
            .then( (result) => {
                eachInfo.push(unincludeAddr[i],result);
                // console.log(unincludeAddr[i]);
                // console.log(result);
                // userArr.push(result);
                unincludeAddrList.push(eachInfo);
            });
        }
    }


    // console.log(unincludeAddrList);

    for(let i=0; i<unincludeAddrList.length; i++){
        fs.open(file2, 'w', (err,fd) => {
            if(err) throw err;
            
            fs.appendFile(file2,unincludeAddrList[i].join()+'\n', 'utf-8',(err)=>{
                console.log('write end!');
            })
        })
    }
    
    // for(let i=0; i<accountInfo.length; i++){
    //     // console.log(`${i} : ${accountInfo[i].w_addr}`);
    //     for(let k=0; k<userList.length; k++){
    //         if(userList.indexOf){

    //         }
    //     }
    // }
    // for(let i=0; i<accountInfo.length; i++){
    //     for(let k=0; k<userList.length; k++){
    //         if(accountInfo.indexOf)
    //     }
    // }
})

router.get('/gasInfo', async(req, res, next) => {
    gasInfo.then((gasRes) => {
        gasPrice = (JSON.parse(gasRes).fast + 10).toString() + "00000000";
        console.log(gasPrice);
    });
})

module.exports = router;


