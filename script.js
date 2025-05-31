const showImg = document.getElementById("image_show");
const message = document.getElementById("result-text");

document.getElementById("imageInput").addEventListener("change", function (event) {
  const fileInput = event.target;

  if (fileInput.files.length > 0) {
    const selectedFile = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const base64Image = e.target.result;
      message.innerText = "";
      showImg.src = "./loading.gif";

      // Convert base64 to Blob
      const byteString = atob(base64Image.split(",")[1]);
      const mimeString = base64Image.split(",")[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      // Prepare FormData
      const formData = new FormData();
      formData.append("file", blob);

      axios({
        method: "POST",
        url: "https://detect.roboflow.com/garbage-detector-ccn0g/1",
        params: {
          api_key: "P0IdQ8jZWlbmmKyNSMwg",
        },
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
        .then(function (response) {
          showImg.src = base64Image;

          const data = response.data;
          if (data.predictions.length > 0) {
            message.style.color = "red";
            message.innerText = "Not Cleaned";
          } else {
            message.style.color = "green";
            message.innerText = "Cleaned";
          }
          console.log(data);
        })
        .catch(function (error) {
          console.error("Upload error:", error);
          message.style.color = "orange";
          message.innerText = "Error processing image.";
        });
    };

    reader.readAsDataURL(selectedFile);
  }
});
