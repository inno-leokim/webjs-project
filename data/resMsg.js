const MSG = (userID = "") => {
    return {
        trErr : {
            "code":"0003",
            "status":"fail",
            "msg":"거래 실패하였습니다. \n토큰 수량 및 이더리움 수량을 확인해 주시기 바랍니다.",
            "userID" : userID
        },
        idErr : {
            "code":"0004",
            "status":"fail",
            "msg":"잘못된 접근입니다.",
            "userID" : userID
        },
        sessionErr : {
            "code":"0005",
            "status":"fail",
            "msg":"로그인 세션이 종료되었습니다. 다시 로그인 해주시기 바랍니다.",
            "userID" : userID
        },
    }
}

module.exports = MSG;