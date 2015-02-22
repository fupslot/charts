var express = require('express');
var cors = require('cors');
var app = express();

app.set('port', process.env.PORT || 3000);

app.use(cors());

app.get('/data/users',function (req, res){
    res.type('text/plain');
    res.status(200).send((Math.random()*10).toString());
});

var times = 0;
var time_max = 20;
app.get('/data/events',function (req, res){
    var data = {
        'event#1': (Math.random() * 14),
        'event#2': (Math.random() * 10),
        'event#3': (Math.random() * 19)
    };

    times += 1;
    if (times === time_max) {
    	times = 0;
    	data['event#4'] = (Math.random() * 23);
    }

    res.json(data);
});

app.listen(app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

