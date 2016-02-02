/**
 * Created by idoco on 29/1/2016.
 * buttons logic
 */

var Github = require("github-api");
var Entry = require("./Entry");

function Controller() {

    var github, mainRepo, forkedRepo,
        username, password,
        retries = 10;

    function refreshMap() {
        var iFrame = document.getElementById("mapFrame");
        //noinspection SillyAssignmentJS
        iFrame.src = iFrame.src;
    }

    function postRandomEntry() {
        if (!github) {
            username = prompt("Please enter GitHub username");
            password = prompt("Please enter GitHub password");

            github = new Github({
                username: username,
                password: password,
                auth: "basic"
            });
        }

        mainRepo = github.getRepo("idoco", "GeoJsonHack");
        mainRepo.fork(function (err) {
            if (err) return console.error(err);
            pollForFork();
        });
    }

    function pollForFork() {
        forkedRepo = github.getRepo(username, "GeoJsonHack");

        forkedRepo.contents('gh-pages', "map.geojson",
            function (err) {
                if (err && retries) {
                    console.error(err);
                    retries--;
                    setTimeout(pollForFork, 100);
                } else {
                    readMapFile();
                }
            }
        );
    }

    function readMapFile() {
        forkedRepo.read('gh-pages', 'map.geojson',
            function (err, geojson) {
                if (err) return console.error(err);
                editMapFile(geojson);
            }
        );
    }

    function editMapFile(geojson) {
        var entry = Entry.createRandomEntry();
        geojson.features.push(entry);

        var options = {
            committer: {name: username, email: username + '@unknown.com'},
            encode: true // Whether to base64 encode the file. (default: true)
        };

        forkedRepo.write('gh-pages', 'map.geojson', JSON.stringify(geojson, null, 4), 'Adding entry to map', options,
            function (err) {
                if (err) return console.error(err);
                createPullRequest();
            }
        );
    }

    function createPullRequest() {
        var pull = {
            title:  "New entries by " + username,
            body:   "This pull request has been automatically generated by Github.js",
            base:   "gh-pages",
            head:   username + ":" + "gh-pages"
        };

        mainRepo.createPullRequest(pull,
            function (err, pullRequest) {
                if (err) {
                    alert(err.request.responseText);
                    console.error(err);
                    return;
                }
                alert(pullRequest.html_url);
            }
        );
    }

    return {
        refreshMap: refreshMap,
        postRandomEntry: postRandomEntry
    }
}

module.exports = Controller;

