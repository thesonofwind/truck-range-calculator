import requests

headers = {
    'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
}

call = requests.get(
    'https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf62481b46a7c549914a60a9f2280dd295f888&start=8.681495,49.41461&end=8.687872,49.420318',
    headers=headers
)

print(call.status_code, call.reason)
print(call.text)
