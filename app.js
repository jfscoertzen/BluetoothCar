var lights = null;
var turning = null;
var drive = null;

var maxDrive = 79;
var minDrive = -79;
var currentAcceleration = 0;

var currentServer = null;

document.addEventListener('buttonConnect', event => event.preventDefault());
document.addEventListener('buttonDisconnect', event => event.preventDefault());
document.addEventListener('buttonLightsOn', event => event.preventDefault());
document.addEventListener('buttonLightsOff', event => event.preventDefault());
document.addEventListener('buttonLeft', event => event.preventDefault());
document.addEventListener('buttonDrive', event => event.preventDefault());
document.addEventListener('buttonRight', event => event.preventDefault());
document.addEventListener('buttonStop', event => event.preventDefault());
document.addEventListener('buttonReverse', event => event.preventDefault());

function onDeviceInfoButtonClick() {
    navigator.bluetooth.requestDevice({
            acceptAllDevices: true
        })
        .then(device => {
            return device.gatt.connect();
        })
        .then(server => {
            console.log('> Found GATT server');
            currentServer = server;
            return server.getPrimaryServices();
        })
        .then(services => {
            console.log('> Found car service');
            return services[0].getCharacteristics();
        })
        .then(characteristic => {
            console.log('> Found write characteristic');
            characteristic.forEach(function(charac) {
                charac.readValue().then(_ => {
                    var enc = new TextDecoder("utf-8");
                    console.log(enc.decode(_.buffer));
                });
            });
        });
}

function onConnectButtonClick() {
    navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['0000acc0-0000-1000-8000-00805f9b34fb']
        })
        .then(device => {
            return device.gatt.connect();
        })
        .then(server => {
            console.log('> Found GATT server');

            document.getElementById('buttonConnect').disabled = true;
            document.getElementById('buttonDisconnect').disabled = false;

            currentServer = server;
            return server.getPrimaryService('0000acc0-0000-1000-8000-00805f9b34fb');
        })
        .then(service => {
            console.log('> Found car service');

            return service.getCharacteristics();
        })
        .then(characteristic => {
            console.log('> Found characteristics');
            characteristic.forEach(function(charac) {
                console.log('> Characteristic ' + charac.uuid);

                if (charac.uuid === '0000acc4-0000-1000-8000-00805f9b34fb') {
                    lights = charac;
                    document.getElementById('buttonLightsOn').disabled = false;
                    document.getElementById('buttonLightsOff').disabled = true;
                }
                if (charac.uuid === '0000acc2-0000-1000-8000-00805f9b34fb') {
                    turning = charac;
                    document.getElementById('buttonLeft').disabled = false;
                    document.getElementById('buttonRight').disabled = false;
                    document.getElementById('buttonLeftReverse').disabled = false;
                    document.getElementById('buttonRightReverse').disabled = false;
                }
                if (charac.uuid === '0000acc1-0000-1000-8000-00805f9b34fb') {
                    drive = charac;
                    document.getElementById('buttonDrive').disabled = false;
                    document.getElementById('buttonStop').disabled = false;
                    document.getElementById('buttonReverse').disabled = false;
                }
            });
        });
}

function disconnect() {
    if (currentServer !== null) {
        currentServer.disconnect();

        document.getElementById('buttonConnect').disabled = false;
        document.getElementById('buttonDisconnect').disabled = true;
        document.getElementById('buttonLightsOn').disabled = true;
        document.getElementById('buttonLightsOff').disabled = true;
        document.getElementById('buttonLeft').disabled = true;
        document.getElementById('buttonRight').disabled = true;
        document.getElementById('buttonDrive').disabled = true;
        document.getElementById('buttonStop').disabled = true;
        document.getElementById('buttonReverse').disabled = true;
        document.getElementById('buttonLeftReverse').disabled = true;
        document.getElementById('buttonRightReverse').disabled = true;

        currentServer = null;
    }
}

function buttonLightsOn() {
    var cmd = new Uint8Array([1]);
    lights.writeValue(cmd).then(_ => {
        document.getElementById('buttonLightsOn').disabled = true;
        document.getElementById('buttonLightsOff').disabled = false;
    });
}

function buttonLightsOff() {
    var cmd = new Uint8Array([0]);
    lights.writeValue(cmd).then(_ => {
        document.getElementById('buttonLightsOn').disabled = false;
        document.getElementById('buttonLightsOff').disabled = true;
    });
}

function buttonLeft() {
    setDirection(-1);

    buttonDrive();
};

function buttonRight() {
    setDirection(1);

    buttonDrive();
};

function buttonLeftReverse() {
    setDirection(-1);

    buttonReverse();
};

function buttonRightReverse() {
    setDirection(1);

    buttonReverse();
};

var currentDirection = 0;
var settingDirection = -1;
var setDirection = function(value) {
    if (settingDirection === -1)
        settingDirection = setTimeout(function(value) {
            settingDirection = -1;

            var cmd = new Uint8Array([value]);
            turning.writeValue(cmd).then(_ => {
                settingDirection = -1;
                currentDirection = value;
            }).catch(ex => {
                settingDirection = -1;

                if (currentDirection !== value)
                    setDirection(value);
            });
        }, 10, value);
};

function buttonForward() {
    setDirection(0);

    buttonDrive();
};

function buttonReverseDown() {
    setDirection(0);

    buttonReverse();
}

function buttonLeftUp() {
    setDirection(0);

    buttonStopDrive();
}

function buttonRightUp() {
    setDirection(0);

    buttonStopDrive();
}

function buttonLeftReverseUp() {
    setDirection(0);

    buttonStopDrive();
}

function buttonRightReverseUp() {
    setDirection(0);

    buttonStopDrive();
}
//==============================================
// Drive
// 
var acceleration = -1;
var reverse = -1;

var busySending = false;

function sendCurrentAcceleration() {
    if (!busySending) {
        var cmd = new Uint8Array([currentAcceleration]);

        busySending = true;
        drive.writeValue(cmd).then(_ => {
            busySending = false;
        }).catch(ex => {
            busySending = false;
        });
    } else {
        setTimeout(sendCurrentAcceleration, 10);
    }
}

function stopAcceleration() {
    if (acceleration !== -1) {
        clearTimeout(acceleration);
        acceleration = -1;
    }
}

function stopReverse() {
    if (reverse !== -1) {
        clearTimeout(reverse);
        reverse = -1;
    }
}

function buttonDrive() {
    stopAcceleration();

    acceleration = setTimeout(function() {
        acceleration = -1;
        currentAcceleration++;

        if (currentAcceleration >= maxDrive)
            currentAcceleration = maxDrive;
        else
            buttonDrive();

        sendCurrentAcceleration();

        document.getElementById('currentSpeed').innerHTML = currentAcceleration;
    }, 10);
}

function buttonStopDrive() {
    currentAcceleration = 0;
    document.getElementById('currentSpeed').innerHTML = currentAcceleration;

    stopReverse();
    stopAcceleration();

    sendCurrentAcceleration();
}

function buttonStop() {
    currentAcceleration = 0;
    document.getElementById('currentSpeed').innerHTML = currentAcceleration;

    stopAcceleration();
    stopReverse();

    sendCurrentAcceleration();
}

function buttonReverse() {
    stopReverse();
    stopAcceleration();

    reverse = setTimeout(function() {
        reverse = -1;
        currentAcceleration--;

        if (currentAcceleration <= minDrive)
            currentAcceleration = minDrive;
        else
            buttonReverse();

        sendCurrentAcceleration();

        document.getElementById('currentSpeed').innerHTML = currentAcceleration;
    }, 10);
}

function buttonStopReverse() {
    currentAcceleration = 0;
    document.getElementById('currentSpeed').innerHTML = currentAcceleration;

    stopReverse();
    stopAcceleration();

    sendCurrentAcceleration();
}
//==============================================