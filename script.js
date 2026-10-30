(function () {
  "use strict";

  const config = window.NAMCHI_VISTA_CONFIG || {};
  const pricePerSquareFoot = 5000;
  const formatRupees = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });
  const floors = {
    1: [
      { type: "1 BHK", area: 575, count: 2, description: "A comfortable one-bedroom home with a balcony." }
    ],
    2: [
      { type: "1 BHK", area: 750, count: 1, description: "A one-bedroom home with extra room to spread out." },
      { type: "2 BHK", area: 900, count: 1, description: "A two-bedroom home with space for everyday living." }
    ],
    3: [
      { type: "2 BHK", area: 912, count: 1, description: "A two-bedroom home with a balcony." },
      { type: "3 BHK", area: 1080, count: 1, description: "A three-bedroom home with space to make your own." }
    ],
    4: [
      { type: "3 BHK", area: 1080, count: 2, description: "A three-bedroom home with a balcony." }
    ]
  };
  const floorPlanImages = {
    1: { "2d": "assets/images/namchi-floor-1-2d.jpg", "3d": "assets/images/namchi-floor-1-3d.png" },
    2: { "2d": "assets/images/namchi-floor-2-2d.jpg", "3d": "assets/images/namchi-floor-2-3d.png" },
    3: { "2d": "assets/images/namchi-floor-3-2d.jpg", "3d": "assets/images/namchi-floor-3-3d.png" },
    4: { "2d": "assets/images/namchi-floor-4-2d.jpg", "3d": "assets/images/namchi-floor-4-3d.png" }
  };
  let activeFloor = 1;
  let activeView = "2d";
  let rotationX = 0;
  let rotationY = 0;
  let modelZoom = 1;
  let modelPanX = 0;
  let modelPanY = 0;
  let lightboxZoom = 1;
  let lightboxPanX = 0;
  let lightboxPanY = 0;
  let pointerDrag = null;
  let lightboxDrag = null;
  let suppressPlanClick = false;

  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".site-nav");
  const floorTabs = Array.from(document.querySelectorAll(".floor-tab"));
  const planArt = document.getElementById("plan-art");
  const planButton = document.querySelector(".plan-enlarge");
  const floorContent = document.querySelector(".floor-content");
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.querySelector(".lightbox-image");
  const lightboxViewer = document.querySelector(".lightbox-viewer");
  const lightboxCaption = document.querySelector(".lightbox-caption");

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("namchi-vista-theme", theme);
    } catch (error) {
      // Theme selection still works when storage is unavailable.
    }
    const themeButton = document.querySelector(".theme-toggle");
    themeButton.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }

  const themeButton = document.querySelector(".theme-toggle");
  let savedTheme = "";
  try {
    savedTheme = localStorage.getItem("namchi-vista-theme") || "";
  } catch (error) {
    savedTheme = "";
  }
  setTheme(savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  themeButton.addEventListener("click", function () {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });

  menuToggle.addEventListener("click", function () {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    navigation.classList.toggle("is-open", !isOpen);
  });
  navigation.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      navigation.classList.remove("is-open");
    });
  });

  function floorPlanImageMarkup(floor, view) {
    const label = view === "2d" ? "2D floor plan" : "3D floor view";
    const modelClass = view === "3d" ? " is-rotatable" : "";
    return '<img class="floor-plan-image' + modelClass + '" src="' + floorPlanImages[floor][view] + '" alt="Floor ' + floor + ' ' + label + ' from the project brochure" loading="lazy" decoding="async" draggable="false">';
  }

  function applyModelTransform() {
    const image = planArt.querySelector(".is-rotatable");
    if (!image) return;
    image.style.setProperty("--model-rotate-x", rotationX + "deg");
    image.style.setProperty("--model-rotate-y", rotationY + "deg");
    image.style.setProperty("--model-zoom", modelZoom);
    image.style.setProperty("--model-pan-x", modelPanX + "px");
    image.style.setProperty("--model-pan-y", modelPanY + "px");
    planButton.classList.toggle("is-zoomed", modelZoom > 1);
    document.querySelector(".model-zoom-level").textContent = Math.round(modelZoom * 100) + "%";
  }

  function clampPan(image, zoom, x, y) {
    const maxX = image ? Math.max(0, image.clientWidth * (zoom - 1) / 2) : 0;
    const maxY = image ? Math.max(0, image.clientHeight * (zoom - 1) / 2) : 0;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y))
    };
  }

  function setModelZoom(zoom) {
    modelZoom = Math.max(1, Math.min(4, zoom));
    if (modelZoom === 1) {
      modelPanX = 0;
      modelPanY = 0;
    }
    applyModelTransform();
  }

  function resetModelView() {
    rotationX = 0;
    rotationY = 0;
    modelZoom = 1;
    modelPanX = 0;
    modelPanY = 0;
    applyModelTransform();
  }

  function applyLightboxTransform() {
    lightboxImage.style.setProperty("--viewer-zoom", lightboxZoom);
    lightboxImage.style.setProperty("--viewer-pan-x", lightboxPanX + "px");
    lightboxImage.style.setProperty("--viewer-pan-y", lightboxPanY + "px");
    lightboxImage.classList.toggle("is-zoomed", lightboxZoom > 1);
    document.querySelector(".lightbox-zoom-level").textContent = Math.round(lightboxZoom * 100) + "%";
  }

  function clampLightboxPan(zoom, x, y) {
    if (!lightboxImage.naturalWidth || !lightboxImage.naturalHeight || !lightboxViewer.clientWidth || !lightboxViewer.clientHeight) {
      return { x: 0, y: 0 };
    }
    const fitScale = Math.min(
      lightboxViewer.clientWidth / lightboxImage.naturalWidth,
      lightboxViewer.clientHeight / lightboxImage.naturalHeight
    );
    const maxX = Math.max(0, (lightboxImage.naturalWidth * fitScale * zoom - lightboxViewer.clientWidth) / 2);
    const maxY = Math.max(0, (lightboxImage.naturalHeight * fitScale * zoom - lightboxViewer.clientHeight) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y))
    };
  }

  function setLightboxZoom(zoom) {
    lightboxZoom = Math.max(1, Math.min(4, zoom));
    if (lightboxZoom === 1) {
      lightboxPanX = 0;
      lightboxPanY = 0;
    } else {
      const pan = clampLightboxPan(lightboxZoom, lightboxPanX, lightboxPanY);
      lightboxPanX = pan.x;
      lightboxPanY = pan.y;
    }
    applyLightboxTransform();
  }

  function renderFloor() {
    const units = floors[activeFloor];
    document.getElementById("floor-title").textContent = "Floor " + activeFloor;
    document.getElementById("floor-kicker").textContent = "Two homes · Central staircase";
    const panel = document.getElementById("floor-panel");
    panel.setAttribute("aria-labelledby", "floor-tab-" + activeFloor);
    planArt.innerHTML = floorPlanImageMarkup(activeFloor, activeView);
    floorContent.classList.toggle("is-3d", activeView === "3d");
    document.querySelector(".model-controls").hidden = activeView !== "3d";
    planButton.setAttribute("aria-label", activeView === "3d"
      ? "Drag to rotate Floor " + activeFloor + " 3D view. Zoom in and drag to move, or activate to open full view"
      : "Enlarge Floor " + activeFloor + " 2D plan");
    planButton.dataset.caption = "Floor " + activeFloor + " · " + (activeView === "2d" ? "2D floor plan" : "3D floor view") + " · Project brochure";
    applyModelTransform();

    document.getElementById("unit-cards").innerHTML = units.map(function (unit) {
      const countLabel = unit.count === 2 ? " · 2 homes" : "";
      return '<article class="unit-card">' +
        '<div class="unit-topline"><strong>' + unit.type + '</strong><span>' + unit.area + ' sq ft' + countLabel + '</span></div>' +
        '<p>' + unit.description + '</p><p class="unit-price">₹' + pricePerSquareFoot.toLocaleString("en-IN") + ' per sq ft</p>' +
        '<p class="unit-estimate">Estimated price: ' + formatRupees.format(unit.area * pricePerSquareFoot) + '</p>' +
        '<a class="button button-solid" href="#enquiry" data-enquire-bhk="' + unit.type + '">Enquire about this home <span aria-hidden="true">↗</span></a>' +
        '</article>';
    }).join("");
    document.querySelectorAll("[data-enquire-bhk]").forEach(function (link) {
      link.addEventListener("click", function () {
        document.getElementById("interested-bhk").value = link.dataset.enquireBhk;
      });
    });
  }

  floorTabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      activeFloor = Number(tab.dataset.floor);
      resetModelView();
      floorTabs.forEach(function (item) {
        const selected = item === tab;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-selected", String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      renderFloor();
    });
    tab.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      floorTabs[(index + direction + floorTabs.length) % floorTabs.length].click();
      floorTabs[(index + direction + floorTabs.length) % floorTabs.length].focus();
    });
  });
  document.querySelectorAll(".view-button").forEach(function (button) {
    button.addEventListener("click", function () {
      activeView = button.dataset.view;
      resetModelView();
      document.querySelectorAll(".view-button").forEach(function (item) {
        const selected = item === button;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      renderFloor();
    });
  });

  planButton.addEventListener("pointerdown", function (event) {
    if (activeView !== "3d" || !event.isPrimary) return;
    pointerDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: modelPanX,
      panY: modelPanY,
      rotationX: rotationX,
      rotationY: rotationY,
      mode: modelZoom > 1 ? "pan" : "rotate",
      moved: false
    };
    planButton.classList.add("is-dragging");
    planButton.setPointerCapture(event.pointerId);
  });
  planButton.addEventListener("pointermove", function (event) {
    if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
    const dx = event.clientX - pointerDrag.startX;
    const dy = event.clientY - pointerDrag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) pointerDrag.moved = true;
    if (pointerDrag.mode === "pan") {
      const pan = clampPan(planArt.querySelector(".is-rotatable"), modelZoom, pointerDrag.panX + dx, pointerDrag.panY + dy);
      modelPanX = pan.x;
      modelPanY = pan.y;
    } else {
      rotationY = Math.max(-55, Math.min(55, pointerDrag.rotationY + dx * 0.32));
      rotationX = Math.max(-20, Math.min(20, pointerDrag.rotationX - dy * 0.16));
    }
    applyModelTransform();
  });
  function finishModelDrag(event) {
    if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
    suppressPlanClick = pointerDrag.moved;
    pointerDrag = null;
    planButton.classList.remove("is-dragging");
    if (planButton.hasPointerCapture(event.pointerId)) planButton.releasePointerCapture(event.pointerId);
    if (suppressPlanClick) window.setTimeout(function () { suppressPlanClick = false; }, 500);
  }
  planButton.addEventListener("pointerup", finishModelDrag);
  planButton.addEventListener("pointercancel", finishModelDrag);
  planButton.addEventListener("wheel", function (event) {
    if (activeView !== "3d") return;
    event.preventDefault();
    setModelZoom(modelZoom + (event.deltaY < 0 ? 0.2 : -0.2));
  }, { passive: false });
  document.querySelectorAll("[data-model-zoom]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (button.dataset.modelZoom === "reset") {
        resetModelView();
      } else {
        setModelZoom(modelZoom + (button.dataset.modelZoom === "in" ? 0.25 : -0.25));
      }
    });
  });

  function openLightbox(src, caption, alt) {
    lightboxImage.src = src;
    lightboxImage.alt = alt || caption;
    lightboxCaption.textContent = caption;
    lightboxZoom = 1;
    lightboxPanX = 0;
    lightboxPanY = 0;
    applyLightboxTransform();
    if (typeof lightbox.showModal === "function") lightbox.showModal();
  }
  planButton.addEventListener("click", function () {
    if (suppressPlanClick) {
      suppressPlanClick = false;
      return;
    }
    const image = planArt.querySelector("img");
    openLightbox(image.src, planButton.dataset.caption, image.alt);
  });
  document.querySelectorAll(".gallery-item").forEach(function (item) {
    item.addEventListener("click", function () {
      const image = item.querySelector("img");
      openLightbox(item.dataset.image, item.dataset.caption, image.alt);
    });
  });
  document.querySelector(".lightbox-close").addEventListener("click", function () { lightbox.close(); });
  document.querySelectorAll("[data-lightbox-zoom]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (button.dataset.lightboxZoom === "reset") {
        setLightboxZoom(1);
      } else {
        setLightboxZoom(lightboxZoom + (button.dataset.lightboxZoom === "in" ? 0.25 : -0.25));
      }
    });
  });
  lightboxImage.addEventListener("pointerdown", function (event) {
    if (lightboxZoom <= 1 || !event.isPrimary) return;
    lightboxDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: lightboxPanX,
      panY: lightboxPanY
    };
    lightboxImage.classList.add("is-dragging");
    lightboxImage.setPointerCapture(event.pointerId);
  });
  lightboxImage.addEventListener("pointermove", function (event) {
    if (!lightboxDrag || lightboxDrag.pointerId !== event.pointerId) return;
    const pan = clampLightboxPan(lightboxZoom, lightboxDrag.panX + event.clientX - lightboxDrag.startX, lightboxDrag.panY + event.clientY - lightboxDrag.startY);
    lightboxPanX = pan.x;
    lightboxPanY = pan.y;
    applyLightboxTransform();
  });
  function finishLightboxDrag(event) {
    if (!lightboxDrag || lightboxDrag.pointerId !== event.pointerId) return;
    lightboxDrag = null;
    lightboxImage.classList.remove("is-dragging");
    if (lightboxImage.hasPointerCapture(event.pointerId)) lightboxImage.releasePointerCapture(event.pointerId);
  }
  lightboxImage.addEventListener("pointerup", finishLightboxDrag);
  lightboxImage.addEventListener("pointercancel", finishLightboxDrag);
  lightboxViewer.addEventListener("wheel", function (event) {
    event.preventDefault();
    setLightboxZoom(lightboxZoom + (event.deltaY < 0 ? 0.2 : -0.2));
  }, { passive: false });
  lightboxImage.addEventListener("dblclick", function () {
    setLightboxZoom(lightboxZoom > 1 ? 1 : 2);
  });
  lightbox.addEventListener("keydown", function (event) {
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      setLightboxZoom(lightboxZoom + 0.25);
    } else if (event.key === "-") {
      event.preventDefault();
      setLightboxZoom(lightboxZoom - 0.25);
    } else if (event.key === "0") {
      setLightboxZoom(1);
    }
  });
  lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox) lightbox.close();
  });

  function isPlaceholder(value) {
    return !value || /^\[[^\]]+\]$/.test(value) || value === "YOUR_API_KEY";
  }
  document.querySelectorAll('[data-contact="email"]').forEach(function (link) {
    if (!isPlaceholder(config.email)) {
      link.href = "mailto:" + config.email + "?subject=Enquiry%20about%20Namchi%20Vista";
    }
  });
  document.querySelectorAll('[data-contact="whatsapp"]').forEach(function (link) {
    if (!isPlaceholder(config.whatsapp)) {
      const number = String(config.whatsapp).replace(/\D/g, "");
      link.href = "https://wa.me/" + number;
    }
  });
  ["facebook", "instagram"].forEach(function (network) {
    const url = config[network + "Url"];
    if (isPlaceholder(url)) return;
    try {
      const socialUrl = new URL(url);
      if (socialUrl.protocol !== "https:" && socialUrl.protocol !== "http:") {
        console.error("Invalid " + network + " URL in site-config.js: expected an HTTP or HTTPS URL.");
        return;
      }
      document.querySelectorAll('[data-contact="' + network + '"]').forEach(function (link) {
        link.href = socialUrl.href;
      });
    } catch (error) {
      console.error("Invalid " + network + " URL in site-config.js:", error);
    }
  });

  document.getElementById("enquiry-form").addEventListener("submit", function (event) {
    event.preventDefault();
    const status = document.getElementById("form-status");
    if (isPlaceholder(config.whatsapp)) {
      status.textContent = "WhatsApp contact is not configured yet. Please use the email contact once it is available.";
      return;
    }
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    if (!name || !phone) {
      status.textContent = "Please enter your name and phone number.";
      return;
    }
    const message = [
      "Hello, I’m enquiring about Namchi Vista Apartments.",
      "Name: " + name,
      "Phone: " + phone,
      "Interested in: " + (formData.get("bhk") || "Not specified"),
      "Message: " + (String(formData.get("message") || "").trim() || "—")
    ].join("\n");
    const whatsappNumber = String(config.whatsapp).replace(/\D/g, "");
    window.open("https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
    status.textContent = "WhatsApp opened with your enquiry. Please review and send your message.";
  });

  function validCoordinates() {
    const latitude = Number(config.latitude);
    const longitude = Number(config.longitude);
    return !isPlaceholder(config.latitude) && !isPlaceholder(config.longitude) &&
      Number.isFinite(latitude) && Number.isFinite(longitude) &&
      latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  }
  let mapInstance = null;
  function updateMapStyle(type) {
    document.querySelectorAll(".map-style-button").forEach(function (button) {
      const selected = button.dataset.mapType === type;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    if (mapInstance) mapInstance.setMapTypeId(type === "satellite" ? "satellite" : "roadmap");
    else mapFallback.src = mapFallback.src.replace(/([?&]t=)[^&]*/, "$1" + (type === "satellite" ? "k" : "m"));
  }
  document.querySelectorAll(".map-style-button").forEach(function (button) {
    button.addEventListener("click", function () { updateMapStyle(button.dataset.mapType); });
  });

  const mapFallback = document.getElementById("map-fallback");
  const mapLink = document.getElementById("map-open-link");
  const directions = document.getElementById("directions-link");
  if (validCoordinates()) {
    const destination = config.latitude + "," + config.longitude;
    mapLink.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(destination);
    directions.href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(destination);
    if (!isPlaceholder(config.mapsApiKey)) {
      window.initNamchiVistaMap = function () {
        try {
          const center = { lat: Number(config.latitude), lng: Number(config.longitude) };
          const mapElement = document.getElementById("google-map");
          mapElement.hidden = false;
          mapFallback.hidden = true;
          mapInstance = new google.maps.Map(mapElement, {
            center: center,
            zoom: 16,
            mapTypeId: "roadmap",
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true
          });
          const markerSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="60" viewBox="0 0 48 60"><path fill="#1c2520" stroke="#f1f2ee" stroke-width="2" d="M24 2C11.85 2 3 10.86 3 22.3 3 37.2 24 57 24 57s21-19.8 21-34.7C45 10.86 36.15 2 24 2Z"/><circle cx="24" cy="22" r="11" fill="#d98a2b"/><path d="M17 25V17h2l5 5v-5h2v8h-2l-5-5v5Z" fill="#1c2520"/></svg>';
          const primaryMarker = new google.maps.Marker({
            position: center,
            map: mapInstance,
            title: "Namchi Vista Apartments, Kamrang, Namchi",
            icon: {
              url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(markerSvg),
              scaledSize: new google.maps.Size(40, 50),
              anchor: new google.maps.Point(20, 50)
            }
          });
          const infoWindow = new google.maps.InfoWindow({ content: "<strong>Namchi Vista Apartments, Kamrang, Namchi</strong>" });
          primaryMarker.addListener("click", function () { infoWindow.open({ anchor: primaryMarker, map: mapInstance }); });
          infoWindow.open({ anchor: primaryMarker, map: mapInstance });
          const geocoder = new google.maps.Geocoder();
          ["Kamrang College (Namchi)", "Government Tinzir Junior High School"].forEach(function (name) {
            geocoder.geocode({ address: name + ", Kamrang, Namchi, South Sikkim, India" }, function (results, status) {
              if (status === "OK" && results[0]) {
                new google.maps.Marker({
                  position: results[0].geometry.location,
                  map: mapInstance,
                  title: name,
                  icon: { path: google.maps.SymbolPath.CIRCLE, scale: 5, fillColor: "#b8a58c", fillOpacity: 1, strokeColor: "#1c2520", strokeWeight: 1 }
                });
              } else if (status !== "ZERO_RESULTS") {
                console.warn("Could not locate map landmark: " + name + " (" + status + ").");
              }
            });
          });
          updateMapStyle("roadmap");
        } catch (error) {
          mapFallback.hidden = false;
          document.getElementById("google-map").hidden = true;
          console.error("Could not initialize the Namchi Vista map.", error);
        }
      };
      const mapsScript = document.createElement("script");
      mapsScript.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(config.mapsApiKey) + "&callback=initNamchiVistaMap";
      mapsScript.async = true;
      mapsScript.defer = true;
      mapsScript.onerror = function () {
        mapFallback.hidden = false;
        document.getElementById("google-map").hidden = true;
      };
      document.head.appendChild(mapsScript);
    }
  }

  document.getElementById("current-year").textContent = String(new Date().getFullYear());
  renderFloor();
})();
