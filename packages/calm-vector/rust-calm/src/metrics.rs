//! Metrics for vector-only model evaluation

use candle_core::Tensor;
use anyhow::Result;

/// Mean Squared Error between predicted and target vectors
pub fn mse(pred: &Tensor, tgt: &Tensor) -> Result<f32> {
    let diff = (pred - tgt)?;
    let squared = diff.sqr()?;
    let mean = squared.mean_all()?;
    Ok(mean.to_vec0::<f32>()?)
}

/// Mean Squared Error for raw vectors
pub fn mse_vec(pred: &[f32], tgt: &[f32]) -> f32 {
    assert_eq!(pred.len(), tgt.len());
    let sum: f32 = pred.iter()
        .zip(tgt.iter())
        .map(|(p, t)| (p - t).powi(2))
        .sum();
    sum / pred.len() as f32
}

/// Cosine similarity for raw vectors
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    assert_eq!(a.len(), b.len());
    let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a = (a.iter().map(|x| x * x).sum::<f32>()).sqrt();
    let norm_b = (b.iter().map(|x| x * x).sum::<f32>()).sqrt();
    dot / (norm_a * norm_b).max(1e-6)
}

/// Compute precision@k for retrieval tasks
///
/// Returns the fraction of top-k retrieved items that are relevant
pub fn precision_at_k(
    retrieved: &[String],
    relevant: &[String],
    k: usize,
) -> f32 {
    if k == 0 || retrieved.is_empty() {
        return 0.0;
    }

    let top_k = retrieved.iter().take(k);
    let hits = top_k.filter(|item| relevant.contains(item)).count();
    hits as f32 / k.min(retrieved.len()) as f32
}

/// Compute recall@k for retrieval tasks
pub fn recall_at_k(
    retrieved: &[String],
    relevant: &[String],
    k: usize,
) -> f32 {
    if relevant.is_empty() {
        return 0.0;
    }

    let top_k = retrieved.iter().take(k);
    let hits = top_k.filter(|item| relevant.contains(item)).count();
    hits as f32 / relevant.len() as f32
}

/// Validation metrics bundle
#[derive(Debug, Clone)]
pub struct ValidationMetrics {
    pub mse: f32,
    pub cosine_sim: f32,
    pub precision_at_1: f32,
    pub precision_at_3: f32,
    pub precision_at_5: f32,
    pub recall_at_5: f32,
}

impl ValidationMetrics {
    pub fn new() -> Self {
        Self {
            mse: 0.0,
            cosine_sim: 0.0,
            precision_at_1: 0.0,
            precision_at_3: 0.0,
            precision_at_5: 0.0,
            recall_at_5: 0.0,
        }
    }
}

impl Default for ValidationMetrics {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mse_vec() {
        let pred = vec![1.0, 2.0, 3.0];
        let tgt = vec![1.0, 2.0, 3.0];
        let mse = mse_vec(&pred, &tgt);
        assert!(mse < 1e-6);
    }

    #[test]
    fn test_cosine_identity() {
        let v = vec![1.0, 2.0, 3.0];
        let sim = cosine_similarity(&v, &v);
        assert!((sim - 1.0).abs() < 1e-5);
    }

    #[test]
    fn test_precision_at_k() {
        let retrieved = vec!["a".to_string(), "b".to_string(), "c".to_string()];
        let relevant = vec!["a".to_string(), "c".to_string()];
        let p = precision_at_k(&retrieved, &relevant, 3);
        assert!((p - 0.666).abs() < 0.01);
    }

    #[test]
    fn test_recall_at_k() {
        let retrieved = vec!["a".to_string(), "b".to_string()];
        let relevant = vec!["a".to_string(), "c".to_string(), "d".to_string()];
        let r = recall_at_k(&retrieved, &relevant, 5);
        assert!((r - 0.333).abs() < 0.01);
    }
}
