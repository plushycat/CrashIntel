# Analysis and Prediction of Road Traffic Accident Severity in Bangalore 🚦

## Description

This project analyzes road accident data from Bangalore to understand patterns, identify high-risk hotspots, and attempt to predict accident severity. It includes comprehensive data cleaning, advanced exploratory data analysis (EDA), and predictive modeling phases. The main finding is that while the data provides rich insights for analysis (e.g., identifying when, where, and why severe accidents occur), it is insufficient for reliably predicting rare fatal accidents. The final goal is a web dashboard 📊 to showcase the key analytical findings.

---

## Project Structure (Phases)

This project follows a 5-phase structure:

1.  **Phase 1 & 2: Data Preprocessing & Cleaning**
    * Loading and initial inspection of the dataset.
    * Handling duplicates, missing values, and data type conversions.
    * **Advanced Imputation:** Using Decision Tree Regressors to fill missing `Latitude`, `Longitude`, and `Speed_Limit`.
    * **Feature Engineering:** Creating new features like `Time_of_Day` and `Speed_Limit_Bin` for analysis.

2.  **Phase 3: Exploratory Analysis & Pattern Discovery**
    * **Detailed EDA:** Answering 30+ specific questions about accident patterns.
    * **Association Rule Mining:** Using the Apriori algorithm (`mlxtend`) to find combinations of factors leading to severe accidents.
    * **Spatial Clustering:** Using K-means (`scikit-learn`) to identify geographic accident hotspots.
    * **Outlier Detection:** Using Local Outlier Factor (LOF) (`scikit-learn`) to find anomalous accidents.

3.  **Phase 4: Predictive Modeling**
    * Preprocessing data using `ColumnTransformer` (OneHotEncoding, Scaling).
    * Attempting to predict 'Fatal' vs 'Non-Fatal' severity using models like Logistic Regression, Random Forest, and XGBoost.
    * Addressing severe class imbalance using `SMOTE`, `SMOTEENN` (`imbalanced-learn`), `scale_pos_weight` (XGBoost), and threshold tuning via Precision-Recall curves.

4.  **Phase 5: Web Integration**
    * Developing an interactive web dashboard using Streamlit to present Phase 3 findings (hotspots, rules, EDA insights).

---

## Key Findings

* **Analytical Success:** The data provides rich insights:
    * Fatal accidents cluster significantly during **Nighttime** hours (11 PM - 3 AM).
    * **DUI**, **Overspeeding**, and **Driver Fatigue** are the reasons most strongly associated with fatalities.
    * **6 distinct geographic hotspots** were identified via K-means, each with a unique profile (e.g., high-speed corridors vs. congested junctions).
    * Specific high-risk scenarios were found via Apriori (e.g., `{Motorcycle, Wet Road} -> {Serious}`).
* **Predictive Modeling Failure:** The dataset is **insufficient for reliably predicting fatal accidents**. Despite advanced techniques, the best model achieved only a 9.5% F1-Score for the 'Fatal' class due to extreme class imbalance and likely missing predictive features (e.g., speed at impact, seatbelt use).

---

## Technologies Used

* Python 3.x
* Pandas
* NumPy
* Scikit-learn
* Imbalanced-learn
* XGBoost
* Matplotlib
* Seaborn
* MLxtend
* Jupyter Notebook
* Streamlit (for Phase 5)

---

## Setup & How to Run

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YourUsername/YourRepositoryName.git](https://github.com/YourUsername/YourRepositoryName.git)
    cd YourRepositoryName
    ```
2.  **Create a virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```
3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Run the Jupyter Notebooks:**
    * Start Jupyter: `jupyter notebook`
    * Open and run the notebooks sequentially (e.g., `Phase 1-2.ipynb`, then `Phase 3-4.ipynb`). Make sure the dataset (`road-accidents-in-bangalore-2007-20191.csv`) is accessible.
5.  **Run the Streamlit App (Phase 5):**
    * Navigate to the directory containing `app.py`.
    * Run: `streamlit run app.py`

---

## Future Work

* Acquire a richer dataset with more granular features (speed at impact, seatbelt usage, driver condition) to attempt predictive modeling again.
* Complete and deploy the Streamlit web dashboard based on the successful Phase 3 analysis.
