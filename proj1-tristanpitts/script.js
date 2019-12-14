function noClick1() {
  window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank");
}

function noClick2() {
  var e = document.getElementsByTagName("*");
  for (v of e)
  {
    v.remove();
  }

  document.write("You broke it :(");
}
