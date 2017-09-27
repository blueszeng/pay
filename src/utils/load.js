import xml2js from 'xml2js'

export const load = async function (stream) {
    var buffers = [];
    return new Promise((resolve, reject) => {
        stream.on('data', function (trunk) {
            buffers.push(trunk);
        });
        stream.on('end', function () {
            return resolve(Buffer.concat(buffers))
        });
        stream.once('error', function (err) {
            return reject(err)
        });
    })
}

export const parseString = async function (xml) {
    return new Promise((resolve, reject) => {
        xml2js.parseString(xml, { trim: true }, function (err, result) {
            if (err) {
                err.name = 'BadMessage' + err.name
                return  reject(err)
            }
            return resolve(result)
        })
    });
}

