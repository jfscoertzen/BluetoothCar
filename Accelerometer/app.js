var App = {
    Car: {
        Rotation: 90,
        Rotate: (byDeg) => {
            if (App.Car.Rotation >= 360) App.Car.Rotation = 0;
            App.Car.Rotation += byDeg;
            RotateElement('.car', App.Car.Rotation);
        }
    }
};

RotateElement = (element, degree) => {
    $(element).css({
        '-webkit-transform' : 'rotate(' + degree + 'deg)',
        '-moz-transform'    : 'rotate(' + degree + 'deg)',
        '-ms-transform'     : 'rotate(' + degree + 'deg)',
        '-o-transform'      : 'rotate(' + degree + 'deg)',
        'transform'         : 'rotate(' + degree + 'deg)'
    });
}

window.addEventListener('deviceorientation', function (result) {
    App.Roll = ((result.beta === null) ? 0 : result.beta);
    App.Pitch = ((result.gamma === null) ? 0 : result.gamma);
    App.Yaw = ((result.alpha === null) ? 0 : result.alpha);

    $("#roll").html(App.Roll);
    $("#pitch").html(App.Pitch);
    $("#yaw").html(App.Yaw);
}, false);

App.Car.Rotate(0);