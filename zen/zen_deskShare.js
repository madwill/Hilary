function startApplet(red5, domain, userid, maxRes, FPS, bitrate)
{

        var div = document.createElement("div");
        div.id = "deskshare";


    div.innerHTML = "<applet code=\"com.iedit.zenlive.screenshare.ZenShareApplet.class\"" +
                        "id=\"DeskShareApplet\" width=\"0\" height=\"1\" archive=\"zenDeskshare.jar, juv.jar, bridj.jar\">" +
                "<param name=\"red5\" value=\"" + red5  + "\"/>" +
                "<param name=\"domain\" value=\"" + domain + "\"/>" +
				"<param name=\"userid\" value=\"" + userid  + "\"/>" +
                "<param name=\"maxRes\" value=\"" + maxRes + "\"/>" +
				"<param name=\"FPS\" value=\"" + FPS  + "\"/>" +
                "<param name=\"bitrate\" value=\"" + bitrate + "\"/>" + "</applet>";

    document.body.appendChild(div);
}

function removeFrame () {
    var div = document.getElementById("deskshare");
    div.parentNode.removeChild(div);
}

function setScreenCoordinates(x, y) {
   return frames[frames.length - 1].document.DeskShareApplet.setScreenCoordinates(x,y);
}

function stopApplet(){
        frames[frames.length - 1].document.DeskShareApplet.destroy();
        removeFrame();
}

function checkForJava(){
//      if (navigator.javaEnabled() || window.navigator.javaEnabled())
                return 1;
}
