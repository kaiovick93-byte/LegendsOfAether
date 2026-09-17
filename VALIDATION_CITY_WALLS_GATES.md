# Round 87 — City walls / South Gate / East Gate

Scope of this revision:
- new `isometric_city_wall_v2.png` wall art;
- new `isometric_city_gate_v2.png` South Gate art;
- new `isometric_city_gate_east_v2.png` East Gate art;
- wall modules changed from 2 logical tiles to 4 logical tiles;
- gate target width changed to 432 px;
- collision decoupled from PNG alpha and defined in isometric logical rectangles;
- gate center remains traversable; tower shoulders remain blocked;
- occlusion for the new wall/gates intentionally deferred.

Static collision validation also checks the two gate shoulders. The tower collision rectangles overlap the adjacent wall collision at logical coordinates 10.0 and 18.0 so no side leak remains.

Live browser rendering was not available in the execution environment because its managed Chromium policy blocks all URLs, including localhost. Visual confirmation in the actual game should therefore be done by the user after opening this build locally.
