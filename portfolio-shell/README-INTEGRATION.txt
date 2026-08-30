PORTFOLIO SINGLE-PAGE INTEGRATION

This package adds only a new integration layer around the three supplied,
locked section packages.

Current milestone:
Home -> My Projects

The Home portal is started through the existing Home API and the integration
layer listens for the existing portfolio:destination-ready event. Projects is
made visible only after that event. The supplied source files are not edited.

Run portfolio.html through a local HTTP server (for example VS Code Live
Server). Same-origin access is required so the integration layer can connect
to the existing Home custom event without modifying Home.
