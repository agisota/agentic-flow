//! Training utilities for next-vector prediction models

use anyhow::{Result, Context};
use candle_core::{Tensor, DType, Device};
use candle_nn::{VarBuilder, Optimizer, AdamW};
use serde::Deserialize;
use crate::{encoder::hash_embed, model::NextVec};

#[derive(Deserialize, Debug, Clone)]
pub struct Pair {
    pub prev: String,
    pub next: String,
}

/// Training configuration
#[derive(Debug, Clone)]
pub struct TrainConfig {
    pub dim: usize,
    pub hidden: usize,
    pub lr: f64,
    pub epochs: usize,
    pub batch_size: usize,
}

impl Default for TrainConfig {
    fn default() -> Self {
        Self {
            dim: 384,
            hidden: 768,
            lr: 0.001,
            epochs: 10,
            batch_size: 8,
        }
    }
}

/// Train model on JSONL pairs file
pub fn train_from_jsonl(path: &str, cfg: TrainConfig, device: &Device) -> Result<Vec<u8>> {
    let data = std::fs::read_to_string(path)
        .context("Failed to read training data")?;

    let pairs: Vec<Pair> = data
        .lines()
        .filter(|l| !l.trim().is_empty())
        .map(|l| serde_json::from_str::<Pair>(l))
        .collect::<Result<_, _>>()
        .context("Failed to parse JSONL")?;

    if pairs.is_empty() {
        anyhow::bail!("No training pairs found");
    }

    let mut vm = candle_nn::VarMap::new();
    let vb = VarBuilder::from_varmap(&vm, DType::F32, device);
    let model = NextVec::new(&vb, cfg.dim, cfg.hidden)?;

    let params = vm.all_vars();
    let mut opt = AdamW::new(params, cfg.lr)?;

    println!("Training on {} pairs for {} epochs...", pairs.len(), cfg.epochs);

    for epoch in 0..cfg.epochs {
        let mut total_loss = 0.0;
        let mut count = 0;

        for pair in &pairs {
            let a = hash_embed(&pair.prev, cfg.dim);
            let b = hash_embed(&pair.next, cfg.dim);

            let a_t = Tensor::from_vec(a, cfg.dim, device)?;
            let b_t = Tensor::from_vec(b, cfg.dim, device)?;

            let pred = model.forward(&a_t)?;
            let loss = (&pred - &b_t)?.sqr()?.mean_all()?;

            opt.backward_step(&loss)?;

            total_loss += loss.to_vec0::<f32>()?;
            count += 1;
        }

        let avg_loss = total_loss / count as f32;
        println!("Epoch {}/{}: loss={:.6}", epoch + 1, cfg.epochs, avg_loss);
    }

    // Serialize weights
    let bytes = vm.data()
        .context("Failed to serialize model weights")?
        .to_vec();

    Ok(bytes)
}

/// Training metrics
#[derive(Debug, Clone)]
pub struct TrainingMetrics {
    pub epoch: usize,
    pub loss: f32,
    pub samples: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_pairs() {
        let data = r#"{"prev": "hello", "next": "world"}
{"prev": "foo", "next": "bar"}"#;

        let pairs: Vec<Pair> = data
            .lines()
            .map(|l| serde_json::from_str(l))
            .collect::<Result<_, _>>()
            .unwrap();

        assert_eq!(pairs.len(), 2);
        assert_eq!(pairs[0].prev, "hello");
    }

    #[test]
    fn test_train_config_default() {
        let cfg = TrainConfig::default();
        assert_eq!(cfg.dim, 384);
        assert_eq!(cfg.hidden, 768);
    }
}
