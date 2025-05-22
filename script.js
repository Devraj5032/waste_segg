const showImg = document.getElementById("image_show");
const message = document.getElementById("result-text");
// const myCanvas = document.getElementById("myCanvas");
// const ctx = myCanvas.getContext("2d");

document
  .getElementById("imageInput")
  .addEventListener("change", function (event) {
    const fileInput = event.target;

    if (fileInput.files.length > 0) {
      const selectedFile = fileInput.files[0];
      const render = new FileReader();

      render.onload = function (e) {
        message.innerText = "";
        const base64Image = e.target.result;
        showImg.src = "./loading.gif";
        axios({
          method: "POST",
          url: "https://detect.roboflow.com/garbage-detector-ccn0g/1",
          params: {
            api_key: "P0IdQ8jZWlbmmKyNSMwg",
          },
          data: base64Image,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
          .then(function (response) {
            showImg.src = base64Image;

            const data = response.data;
            // myCanvas.height = 0;
            // myCanvas.width = 0;
            if (data.predictions.length > 0) {
              // myCanvas.height = data.image.height;
              // myCanvas.width = data.image.width;
              // for (let i = 0; i < data.predictions.length; i++) {
              //   showImg.onload = function () {
              //     ctx.drawImage(
              //       showImg,
              //       0,
              //       0,
              //       data.image.width,
              //       data.image.height
              //     );
              //     // Draw a red rectangle over the image
              //     ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
              //     ctx.fillRect(
              //       data.predictions[i].x,
              //       data.predictions[i].y,
              //       100,
              //       100
              // );
              // };
              // }

              message.style.color = "red";
              message.innerText = "Not Cleaned";
            } else {
              message.style.color = "green";
              message.innerText = "Cleaned";
            }
            console.log(data);
          })
          .catch(function (error) {
            console.log(error.message);
          });
      };

      render.readAsDataURL(selectedFile);
    }
  });
