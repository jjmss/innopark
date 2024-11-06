# InnoCamp parkering

Enkel express app som endrer på regnr på bil for parkering via pportal.cowisys.no

## Setup .env

| Variabler          | Beskrivelse                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `PPORTAL_USERNAME` | Brukernavnet på https://pportal.cowisys.no/steinkjer/Account/Login                        |
| `PPORTAL_PASSWORD` | Passordet ditt på https://pportal.cowisys.no/steinkjer/Account/Login                      |
| `APP_SECRET`       | Hemmelig nøkkel som sjekkes i GET request for å sørge for at det er du som gjør endringer |

## Publiser til en server

Kjør ut slik at den er tilgjengelig via url.

## iOS Snarvei

Bruk templaten her: https://www.icloud.com/shortcuts/60bba68df5724b2794c04a217ececd80
og juster på delen som gjør request med korrekt url og `x-secret` (lik `APP_SECRET`)
