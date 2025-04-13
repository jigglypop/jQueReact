$(document).ready(function () {
  // 간단한 jQuery 스타일링 및 이벤트 처리
  $('div.greeting')
    .css('color', 'blue')
    .css('fontSize', '24px')
    .text('Hello from jQuery!')
    .on('click', function () {
      alert('Greeting clicked!');
    });

  // 버튼에 이벤트 추가
  $('button.action')
    .addClass('highlight')
    .on('click', function () {
      $(this).text('Clicked!');
      $('div.greeting').css('color', 'red');
    });
});
