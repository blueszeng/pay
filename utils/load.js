
const load = async function (stream) {
    var buffers = [];
    stream.on('data', function (trunk) {
        buffers.push(trunk);
    });
    stream.on('end', function () {
        return Promise.resolve(Buffer.concat(buffers))
    });
    stream.once('error', function (err) {
        return Promise.reject(err)
    });
};

export { load }

