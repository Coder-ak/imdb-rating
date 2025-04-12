(function () {
  "use strict";

  let url = "https://imdb.coderak.net/api/v1/rating/"; // .../rating/tt123456
  let cache_time = 86400000; // 1 day

  function rating_imdb(id) {
    let rating = getCache(id);
    if (rating != null) {
      showRating(rating);
    } else {
      getRating(id);
    }
  }

  function getRating(id) {
    let network = new Lampa.Reguest();
    network.clear();
    network.timeout(15000);
    network.silent(url + id, function (json) {
      if (json && json.rating) {
        showRating(json.rating);
        setCache(id, json.rating);
      }
    });
  }

  // return imdb rating if exists in cache
  function getCache(id) {
    let cache = Lampa.Storage.cache("imdb_rating", 500, {});
    if (cache[id]) {
      if (Date.now() - cache[id].timestamp > cache_time) {
        delete cache[id];
        Lampa.Storage.set("imdb_rating", cache);
        return false;
      }
      return cache[id].imdb;
    }
  }

  // set cache with imdb rating and current timestamp
  function setCache(id, imdb) {
    let cache = Lampa.Storage.cache("imdb_rating", 500, {});
    cache[id] = {
      imdb,
      timestamp: Date.now(),
    };
    Lampa.Storage.set("imdb_rating", cache);
  }

  function showRating(rating) {
    const ratingValue = parseFloat(rating);
    if (ratingValue != NaN) {
      var render = Lampa.Activity.active().activity.render();
      $(".wait_rating", render).remove();
      $(".rate--imdb", render)
        .removeClass("hide")
        .find("> div")
        .eq(0)
        .text(ratingValue.toFixed(1));
    }
  }

  function startPlugin() {
    window.imdb_plugin = true;
    Lampa.Listener.follow("full", function (e) {
      if (e.type == "complite") {
        var render = e.object.activity.render();
        if (
          $(".rate--imdb", render).hasClass("hide") &&
          !$(".wait_rating", render).length
        ) {
          $(".info__rate", render).after(
            '<div style="width:2em;margin-top:1em;margin-right:1em" class="wait_rating"><div class="broadcast__scan"><div></div></div><div>',
          );
          if (e.data.movie.imdb_id) rating_imdb(e.data.movie.imdb_id);
        }
      }
    });
  }

  if (!window.imdb_plugin) startPlugin();
})();
