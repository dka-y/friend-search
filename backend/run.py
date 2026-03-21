
from app.init import create_app, seed_demo_data

app = create_app()

if __name__ == "__main__":
    seed_demo_data()
    app.run(debug=True, port=5000)