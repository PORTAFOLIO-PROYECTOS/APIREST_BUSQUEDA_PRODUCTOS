const os = require("os");

class logEvent {
    constructor(
        level,
        className,
        method,
        parameters,
        message,
        elapsedTime,
        pais,
        exception,
        contentLength = 0,
        remoteAddress = "",
        source = "",
        application = ""
    ) {
        this.Date = new Date();
        this.HostName = os.hostname();
        this.Trace = "LogEvent";
        this.Level = level;
        this.Class = className;
        this.Method = method;
        this.Parameters = parameters;
        this.Message = message;
        this.ElapsedTime = elapsedTime;
        this.Pais = pais;
        this.Exception = exception;
        this.ContentLength = contentLength;
        this.RemoteAddress = remoteAddress;
        this.Source = source;
        this.Application = application;
    }
}

module.exports = logEvent;