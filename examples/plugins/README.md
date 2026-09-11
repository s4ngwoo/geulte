# Geulte 플러그인 예제

프로젝트 루트에 `geulte.config.mjs`를 두면 빌드 시 로드됩니다.

```js
import { siteTitlePlugin } from './examples/plugins/site-title.mjs';

export default {
  plugins: [siteTitlePlugin({ suffix: ' · Demo' })],
};
```

## 훅

| 훅 | 시점 |
| :--- | :--- |
| `onConfig` | YAML 설정 로드 직후 (설정 반환으로 변형) |
| `afterScan` | 마크다운 스캔·파싱 후, 백링크·HTML 생성 전 |
| `afterGenerate` | 정적 산출물 생성 직후 |

훅 실패 시 `Plugin "<name>" <hook> failed: …` 형태로 throw 됩니다.
