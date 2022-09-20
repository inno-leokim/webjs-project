const appRoot = require('app-root-path');    // app root 경로를 가져오는 lib
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const winstonDaily = require('winston-daily-rotate-file');

const logFormat = printf(({level, label, timestamp}) => {
    return '\r\n'+timestamp + " [" + label + "] " + level + " : ";
});

const timezoned = () => {
    return new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Seoul'
    });
};

const logger = createLogger({
    level : 'info',
    format : combine(
        label({label:'glex-log'}),
        timestamp({ format: timezoned}),
        logFormat,
        format.json()
    ),
    // transports: [
    //     new transports.File({ filename: `${appRoot}/logs/glex-api.log`}),
    //     new transports.File({ filename: `${appRoot}/logs/error.log`, level:'error'})
    // ],
    transports: [
        new (winstonDaily)({
            filename : appRoot + '/logs/glex-api-%DATE%.log',
            datePattern : 'YYYY-MM-DD',
            maxsize : 50000000,
            maxFiles:1000,
            level : 'info',
            showLevel : true,
            timestamp : timezoned()
        }),
        new (winstonDaily)({
            filename : appRoot + '/logs/error-%DATE%.log',
            datePattern : 'YYYY-MM-DD',
            maxsize : 50000000,
            maxFiles:1000,
            level : 'error',
            showLevel : true,
            timestamp : timezoned()
        })
    ]
});

if (process.env.NODE_ENV !== 'production'){
    logger.add(new transports.Console({format:format.simple()}));
}

module.exports = logger;