$(document).ready(function() {
  $('.flowchart-example').each(function() {
    var $this = $(this);
    var $script = $this.find('script');
    var source = $script.text();
    var $showsource = $('<a class="flowchart-show-source" href="#" data-show="0">Show source</a>');
    $this.append($showsource);
    var $source = $('<pre></pre>');
    $source.text(source);
    $this.append($source);
    $showsource.click(function(e) {
      e.preventDefault();
      var $this = $(this);
      if ($this.data('show') == '0') {
        $this.data('show', '1');
        $source.show();
        $this.text('Hide source');
        window.scrollTo(0, $source.offset().top);
      } else {
        $this.data('show', '0');
        $source.hide();
        $this.text('Show source');
      }
    });
  });
});