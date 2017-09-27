import xml2js from 'xml2js'

export const load = async function (stream) {
    var buffers = [];
    return new Promise((resolve, reject) => {
        console.log('sbsbsbs')
        stream.on('data', function (trunk) {
            console.log('sbsbsbs22')
            buffers.push(trunk);
        });
        stream.on('end', function () {
            console.log('sbsbsbs2233333', Buffer.concat(buffers))
            return resolve(Buffer.concat(buffers))
        });
        stream.once('error', function (err) {
            return reject(err)
        });
        console.log('sbsbsbs555555')
    })
}

export const parseString = async function (xml) {
    console.log('sbsbsbs', xml)
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

