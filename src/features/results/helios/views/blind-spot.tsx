import { fmt1, fmt2 } from "../../format";
import { Card, DataTable, Td, Th, ViewSection } from "../../ui";
import { cell, scenarios, sunBlindSpot } from "../derive";
import { ESTIMATORS } from "../evidence";
import { ESTIMATOR_INFO, Source, WorkInProgress } from "../shared";

export function BlindSpotView() {
  const b = sunBlindSpot();
  const spin = sunBlindSpot("sun_axis_spin");

  return (
    <div className="space-y-14">
      <WorkInProgress />

      <ViewSection
        id="geometry"
        title="What a Sun sensor can and can't see"
        intro={
          <p>
            Any orientation error is a small turn about some axis. Part of it moves the Sun in the sensor&apos;s view,
            so the sensor notices. The part that rolls the device around the line to the Sun leaves the Sun exactly
            where it was, so no Sun sensor can ever notice it. The benchmark scores the two parts separately.
          </p>
        }
      >
        <Card>
          <figure className="min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- a static diagram, shown as drawn */}
            <img
              src="/blog/helios/sun-error-geometry.svg"
              alt="An error turn split into a cross-Sun part the sensor sees and an along-Sun part it cannot"
              className="mx-auto block h-auto w-full max-w-2xl rounded-md"
              loading="lazy"
            />
          </figure>
        </Card>
      </ViewSection>

      <ViewSection
        id="still"
        title="Sitting still: the proof in numbers"
        intro={
          <p>
            In the <span className="font-mono">static</span> scenario, the gyro&apos;s drift splits into {fmt1(b.gyroCross)}°
            the Sun sensor can see and {fmt1(b.gyroAlong)}° it can&apos;t. Every Sun-only estimator cuts the visible part to{" "}
            {fmt2(b.sunOnlyCrossMin)}–{fmt2(b.sunOnlyCrossMax)}°, but leaves the hidden part at {fmt1(b.sunOnlyAlongMin)}–
            {fmt1(b.sunOnlyAlongMax)}°. Gravity, a second direction, brings it to {fmt2(b.gravityAlong)}°. Spinning about
            the Sun line tells the same story: {fmt1(spin.sunOnlyAlongMin)}–{fmt1(spin.sunOnlyAlongMax)}° hidden error for
            Sun-only, {fmt2(spin.gravityAlong)}° with gravity.
          </p>
        }
      >
        <Card bodyClassName="p-0 sm:p-0" source={<Source from="summary" field="rms_cross_sun_deg_mean, rms_along_sun_deg_mean" calc="sunBlindSpot" />}>
          <DataTable caption="Cross-Sun and along-Sun RMS error by scenario and estimator, degrees" className="rounded-none border-0">
            <thead>
              <tr>
                <Th>Scenario</Th>
                {ESTIMATORS.map((e) => (
                  <Th key={e} numeric>
                    <span className={ESTIMATOR_INFO[e].textClass}>{ESTIMATOR_INFO[e].name}</span>
                    <span className="block text-[10px] font-normal text-muted-foreground">seen / hidden</span>
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scenarios().map((s) => (
                <tr key={s}>
                  <Td mono className="text-xs">
                    {s}
                  </Td>
                  {ESTIMATORS.map((e) => (
                    <Td key={e} numeric>
                      {fmt2(cell(s, e, "rms_cross_sun_deg_mean"))}
                      <span className="text-muted-foreground"> / </span>
                      <span className={e === "mekf_sun_gravity" ? "text-positive" : "text-foreground/70"}>
                        {fmt2(cell(s, e, "rms_along_sun_deg_mean"))}
                      </span>
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Card>
        <p className="mt-3 text-sm text-foreground/75">
          Movement helps the Sun-only Kalman filter: when the device turns, the Sun line moves in the device&apos;s own
          axes, so over time all three gyro errors become visible. That is why it does well in the hand-held
          scenarios and badly when still.
        </p>
      </ViewSection>
    </div>
  );
}
