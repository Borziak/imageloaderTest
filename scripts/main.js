jQuery(document).ready(function ($) {
    var Router = {
        routes: [],
        mode: null,
        root: '/',
        config: function (options) {
            this.mode = options && options.mode && options.mode == 'history'
            && !!(history.pushState) ? 'history' : 'hash';
            this.root = options && options.root ? '/' + this.clearSlashes(options.root) + '/' : '/';
            return this;
        },
        getFragment: function () {
            var fragment = '';
            if (this.mode === 'history') {
                fragment = this.clearSlashes(decodeURI(location.pathname + location.search));
                fragment = fragment.replace(/\?(.*)$/, '');
                fragment = this.root != '/' ? fragment.replace(this.root, '') : fragment;
            } else {
                var match = window.location.href.match(/#(.*)$/);
                fragment = match ? match[1] : '';
            }
            return this.clearSlashes(fragment);
        },
        clearSlashes: function (path) {
            return path.toString().replace(/\/$/, '').replace(/^\//, '');
        },
        add: function (re, handler) {
            if (typeof re == 'function') {
                handler = re;
                re = '';
            }
            this.routes.push({re: re, handler: handler});
            return this;
        },
        remove: function (param) {
            for (var i = 0, r; i < this.routes.length, r = this.routes[i]; i++) {
                if (r.handler === param || r.re.toString() === param.toString()) {
                    this.routes.splice(i, 1);
                    return this;
                }
            }
            return this;
        },
        flush: function () {
            this.routes = [];
            this.mode = null;
            this.root = '/';
            return this;
        },
        check: function (f) {
            var fragment = f || this.getFragment();
            for (var i = 0; i < this.routes.length; i++) {
                var match = fragment.match(this.routes[i].re);
                if (match) {
                    match.shift();
                    this.routes[i].handler.apply({}, match);
                    return this;
                }
            }
            return this;
        },
        listen: function () {
            var self = this;
            var current = self.getFragment();
            var fn = function () {
                if (current !== self.getFragment()) {
                    current = self.getFragment();
                    self.check(current);
                }
            }
            clearInterval(this.interval);
            this.interval = setInterval(fn, 50);
            return this;
        },
        navigate: function (path) {
            path = path ? path : '';
            if (this.mode === 'history') {
                history.pushState(null, null, this.root + this.clearSlashes(path));
            } else {
                window.location.href = window.location.href.replace(/#(.*)$/, '') + '#' + path;
            }
            return this;
        }
    }

// configuration
    Router.config({mode: 'history'});

// returning the user to the initial state
    Router.navigate();

// adding routes
//     Router
//
//         .add(/sand/, loadAndAnimate('sand'))
//         .add(/water/, loadAndAnimate('water'))
//         .add(function () {
//             console.log('default');
//         });
        // .check('/clouds/').listen();

    let startDate = Date.now();
    let displayedImages = [];
    let wrappersArray = [];
    let previousCoordinates = {x: 0, y: 0};
    let route = getRandomInt(0, 2);
    let currentRoute = ['clouds', 'sand', 'water'];
    let uploadedPercent = 0;
    let errorsPercent = 0;
    let errorsNumber = 0;
    let uploadedNumber = 0;
    let imgCount = 0;
    let totalNumber = 0;
    Router.add(currentRoute[route], loadAndAnimate(currentRoute[route]));
    Router.navigate('/' + currentRoute[route]);
    function loadAndAnimate(route) {
        console.log('At animate route = ' + route);
        displayedImages = [];
        wrappersArray = [];
        uploadedPercent = 0;
        errorsPercent = 0;
        errorsNumber = 0;
        uploadedNumber = 0;
        imgCount = 0;
        totalNumber = 0;
        previousCoordinates = {x: 0, y: 0};
        switch (route) {
            case 'clouds':
                $('body').css('background', 'url("Tests/img/clouds.jpeg")');
                break;
            case 'sand':
                $('body').css('background', 'url("Tests/img/sand.jpeg")');
                break;
            case 'water':
                $('body').css('background', 'url("Tests/img/water3.jpeg")');
                break;
        }
        $(document).on('mousemove', function (event) {
            let mouseX = event.pageX;
            let mouseY = event.pageY;
            $('.preloader_count').css({top: (mouseY - 50), left: mouseX - 20});
        });
        let requestString = 'https://api.pexels.com/v1/search?query=' + route + '+query&per_page=30&page=1';
        let request = generateRequest(requestString, 'GET', '563492ad6f91700001000001bb151c8c07f048768f0c409fc846429b');
        fetch(request).then(function (responce) {
            return responce.json();
        }).then(function (receivedJson) {
            let quadJson = receivedJson.photos.concat(receivedJson.photos, receivedJson.photos);
            createUploadedImages(quadJson);
        });
    }

    function createUploadedImages(jsonArray) {
        $('.images_container').empty();
        jsonArray.forEach(function (currentPhoto) {
            imgCount = jsonArray.length;
            let image = new Image();
            image.src = currentPhoto.src.medium;
            $('.images_container').append(image);
            $(image).wrap('<div class="image_wrap"></div>');
            addListenerWithHandler(image, 'load', loadControlHandler);
            addListenerWithHandler(image, 'error', errorControlHandler);
        });
    }

    const movementHandler = (event) => {
        let mouseX = event.pageX;
        let mouseY = event.pageY;
        let xDistance = Math.abs(mouseX - previousCoordinates.x);
        let yDistance = Math.abs(mouseY - previousCoordinates.y);
        if (imgCount > 0 && (xDistance > 20 || yDistance > 20)) {
            let result = displayRandomImage() || null;
            result ? ($(result[0]).css({
                top: mouseY + result[1] - $(result[0]).outerHeight() / 2,
                left: mouseX + result[2] - $(result[0]).outerWidth() / 2,
                display: 'block'
            }),
                previousCoordinates.x = mouseX,
                previousCoordinates.y = mouseY) : (deleteListener(document, 'mousemove', mouseHandler),
                scatterImages());
        }
    };

    const loadControlHandler = () => {
        uploadedNumber += 1;
        totalNumber += 1;
        uploadedPercent = (uploadedNumber / imgCount) * 100;
        $('.preloader_percent').text(Math.floor(uploadedPercent) + '%');
        if (totalNumber === imgCount) {
            $('.preloader_count').css('display', 'none');
            loadFinalCorrections();
        }
    };

    const errorControlHandler = () => {
        errorsNumber += 1;
        totalNumber += 1;
        errorsPercent = (errorsNumber / imgCount) * 100;
        if (totalNumber === imgCount) {
            // console.log('Error percent = ' + errorsPercent + '% | Number of errors = ' + errorsNumber + ' | Total images number = ' + totalNumber + ' | All images = ' + imgCount);
        }
    };

    const mouseHandler = throttle(movementHandler, 70);

    function addListenerWithHandler(object, type, handler) {
        object.addEventListener(type, handler);
    }

    function deleteListener(object, type, handler) {
        object.removeEventListener(type, handler);
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    function navigateNext() {
        if (currentRoute.indexOf(currentRoute[route + 1]) !== -1) {
            Router.add(currentRoute[route + 1], loadAndAnimate(currentRoute[route + 1]));
            Router.navigate('/' + currentRoute[route + 1]);
            route++;
        } else {
            let newRoute = 0;
            Router.add(currentRoute[newRoute], loadAndAnimate(currentRoute[newRoute]));
            Router.navigate('/' + currentRoute[newRoute]);
            route = 0;
        }
    }

    function scatterImages() {
        let scatteredImages = 0;
        for (let i = 0; i < displayedImages.length; i++) {
            let currentImage = $($(displayedImages)[i]),
                windowWidth = $(window).outerWidth(),
                windowHeight = $(window).outerHeight(),
                currentPositions = {offsets: [], marks: [], endpoints: []};
            if (currentImage === null) {
                return;
            }
            currentPositions.offsets = currentImage.offset() || {top: 0, left: 0};
            currentPositions.marks = {topMark: 0, leftMark: 0};
            currentPositions.distances = {
                toBottom: 0,
                toTop: currentPositions.offsets.top,
                toLeft: currentPositions.offsets.left,
                toRight: 0
            };
            currentPositions.distances.toBottom = windowHeight - currentPositions.distances.toTop - currentImage.outerHeight() / 2;
            currentPositions.distances.toRight = windowWidth - currentPositions.distances.toLeft - currentImage.outerWidth() / 2;
            currentPositions.offsets.top + (currentImage.outerHeight() / 2) > windowHeight / 2 ? currentPositions.marks.topMark = 1 : currentPositions.marks.topMark = 0;
            currentPositions.offsets.left + (currentImage.outerWidth() / 2) > windowWidth / 2 ? currentPositions.marks.leftMark = 1 : currentPositions.marks.leftMark = 0;
            currentPositions.endpoints = {vertical: 0, horizontal: 0};
            var proportion = calculateProportion(windowWidth / 2, currentImage.outerWidth(), windowHeight / 2);
            var horizontalAspect = currentPositions.marks.leftMark === 0 ? ((currentPositions.offsets.left + currentImage.outerWidth() / 2) / currentImage.outerWidth()) : ((windowWidth - currentPositions.offsets.left + currentImage.outerWidth() / 2) / currentImage.outerWidth());
            // console.log('horizontalAspect = ' + horizontalAspect);
            if (currentPositions.marks.topMark === 1) {
                let verticalAspect = (windowHeight - currentPositions.offsets.top + currentImage.outerWidth() / 2) / proportion;
                // console.log('verticalAspect = ' + verticalAspect);
                if (horizontalAspect > verticalAspect - calculatePercent(verticalAspect, 5)) {
                    currentPositions.endpoints = {
                        vertical: windowHeight + 20,
                        horizontal: currentPositions.offsets.left
                    };
                } else if (horizontalAspect < verticalAspect + calculatePercent(verticalAspect, 5)) {
                    currentPositions.endpoints = {
                        vertical: currentPositions.offsets.top,
                        horizontal: currentPositions.marks.leftMark === 0 ? -(currentImage.outerWidth() + 20) : windowWidth + 20
                    };
                } else if (horizontalAspect <= verticalAspect - calculatePercent(verticalAspect, 5) && horizontalAspect >= verticalAspect + calculatePercent(verticalAspect, 5)) {
                    currentPositions.endpoints = {
                        vertical: windowHeight + 20,
                        horizontal: currentPositions.marks.leftMark === 0 ? -(currentImage.outerWidth() + 20) : windowWidth + 20
                    };
                }
            } else {
                let verticalAspect = (currentPositions.offsets.top + currentImage.outerWidth() / 2) / proportion;
                if (verticalAspect > horizontalAspect + calculatePercent(horizontalAspect, 5)) {
                    currentPositions.endpoints = {
                        vertical: currentPositions.offsets.top,
                        horizontal: currentPositions.marks.leftMark === 0 ? -(currentImage.outerWidth() + 20) : windowWidth + 20
                    };
                } else if (verticalAspect < horizontalAspect - calculatePercent(horizontalAspect, 5)) {
                    currentPositions.endpoints = {
                        vertical: -(currentImage.outerWidth() + 20),
                        horizontal: currentPositions.offsets.left
                    };
                } else if (verticalAspect >= horizontalAspect - calculatePercent(horizontalAspect, 5) && verticalAspect <= horizontalAspect + calculatePercent(verticalAspect, 5)) {
                    currentPositions.endpoints = {
                        vertical: -(currentImage.outerWidth() + 20),
                        horizontal: windowWidth + 20
                    };
                }
            }
            let imageQuantity = displayedImages.length;
            let wholeTime = imageQuantity * 5;
            let startTime = Date.now();
            const fps = wholeTime / 6;
            let timer = setInterval(function () {
                let currentTime = Date.now() - startTime;
                if (currentTime >= wholeTime) {
                    clearInterval(timer);
                    return;
                }
                $(currentImage).animate({
                    left: '' + currentPositions.endpoints.horizontal + 'px',
                    top: '' + currentPositions.endpoints.vertical + 'px'
                }, {
                    easing: 'easeOutBounce',
                    queue: true,
                    duration: 1200
                });
            }, fps);
            scatteredImages++;
            console.log(scatteredImages);
            if (scatteredImages >= displayedImages.length - 1) {
                let timer = setInterval(function () {
                    navigateNext();
                    clearInterval(timer);
                }, 600);
            }
        }
    }

    function roundDecimals(number, digitsQuantity, upgradeInteger, roundTrigger) {
        digitsQuantity = parseInt(digitsQuantity) || 1;
        upgradeInteger = upgradeInteger || false;
        roundTrigger = parseInt(roundTrigger) || 7;
        const RegExp = /^(\d*)[,.]?(\d{0,4})?/i;
        if (number > 0) {
            let integerArray = RegExp.exec(number)[1].split(''),
                decimalArray = RegExp.exec(number)[2].split('') || 0;
            if (decimalArray.length > 0) {
                let raiseInteger = false;
                decimalArray.reduceRight(function (previousNumber, currentNumber, index, array) {
                    let result = parseInt(currentNumber);
                    previousNumber >= roundTrigger ? (result += 1, array[index + 1] = 0) : null;
                    (index === 0 && previousNumber >= roundTrigger && upgradeInteger) ? (raiseInteger = true, result = '0') : raiseInteger = false;
                    array[index] = result;
                    return result;
                }, this.length - 1);
                decimalArray.splice(digitsQuantity, decimalArray.length - digitsQuantity);
                integerArray.reduceRight(function (previousNumber, currentNumber, index, array) {
                    let result = parseInt(currentNumber);
                    (upgradeInteger && raiseInteger && index === array.length - 1) ? result += 1 : null;
                    previousNumber >= 10 ? (result += 1, array[index + 1] = 0) : null;
                    array[index] = result;
                    return result;
                }, this.length - 1);
                return parseFloat(integerArray.join('') + '.' + decimalArray.join(''));
            } else {
            }
        } else {
            return number;
        }
    }

    function calculateProportion(a, b, c) {
        let x = (b * c) / a;
        return roundDecimals(x, 2);
    }

    function calculatePercent(wholeNumber, percent) {
        if (percent <= 0 || wholeNumber <= 0)
            return false;

        return wholeNumber * (percent / 100);
    }

    function displayRandomImage() {
        let randDistanceX = getRandomInt(-150, 150);
        let randDistanceY = getRandomInt(-150, 150);
        let imageToDisplay = wrappersArray[displayedImages.length];
        if (displayedImages.indexOf(imageToDisplay) === -1) {
            displayedImages.push(imageToDisplay);
            return [imageToDisplay, randDistanceX, randDistanceY];
        } else {
            // console.log('Already in the array');
        }
    }

    function loadFinalCorrections() {
        let endDate = Date.now();
        let difference = endDate - startDate;
        console.log('Elapsed time for uploading = ' + difference);
        $('.images_container').css('display', 'flex');
        inizializeWrappersArray();
        addListenerWithHandler(document, 'mousemove', mouseHandler);
    }

    function inizializeWrappersArray() {
        wrappersArray = $('.image_wrap');
    }

    function throttle(func, ms) {
        let isThrottled = false,
            savedArgs,
            savedThis;

        function wrapper() {

            if (isThrottled) { // (2)
                savedArgs = arguments;
                savedThis = this;
                return;
            }

            func.apply(this, arguments); // (1)

            isThrottled = true;

            setTimeout(function () {
                isThrottled = false; // (3)
                if (savedArgs) {
                    wrapper.apply(savedThis, savedArgs);
                    savedArgs = savedThis = null;
                }
            }, ms);
        }

        return wrapper;
    }

    function generateRequest(url, method, authorizationKey) {
        let key = authorizationKey || false;
        let headers = new Headers();
        key ? headers.append('Authorization', authorizationKey) : headers = null;
        let init = {
            method: method,
            headers: headers
        };
        return new Request(url, init);
    }
})
;