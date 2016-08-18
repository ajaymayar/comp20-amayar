function FitImagesToScreen() {
  var images = document.getElementsByTagName('img');
  if(images.length > 0){
    for(int i=0; i < images.length; i++){
      if(images[i].width >= (window.innerWidth - 10)){
        images[i].style.width = 'auto';
      }
    }
  }
